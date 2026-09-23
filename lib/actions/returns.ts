'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { adminGql } from '@/lib/shopify/admin'
import { caQuery } from '@/lib/shopify/customer-account'
import { supabaseAdmin } from '@/lib/supabase/client'
import { requireAdmin } from '@/lib/utils/admin-auth'

// 로그인 고객의 numeric customer id — 고객대면 반품 액션의 소유권 검증용.
// lookupOrder·submitReturnRequest는 'use server' 공개 엔드포인트라 UI 게이트(로그인+본인주문)만으론
// 부족하다. 주문번호가 순번이라 추측 가능 → 서버에서 "로그인 고객 == 주문 소유자"를 한 번 더 강제한다.
async function getCustomerId(): Promise<string | null> {
  const store = await cookies()
  const token = store.get('customer_token')?.value
  if (!token) return null
  const data = await caQuery<{ customer: { id: string } }>(token, `{ customer { id } }`)
  return data?.customer?.id?.split('/').pop() ?? null
}

export type OrderLineItem = {
  lineItemId: string
  fulfillmentLineItemId: string | null
  name: string
  quantity: number
  image: string | null
}

export type OrderData = {
  id: string
  name: string
  createdAt: string
  isFulfilled: boolean
  paymentMethod: 'card' | 'bank_transfer'
  lineItems: OrderLineItem[]
}

const LOOKUP_ORDER_QUERY = `
  query($query: String!) {
    orders(first: 1, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          paymentGatewayNames
          shippingAddress { name firstName lastName }
          customer { id displayName firstName lastName }
          lineItems(first: 20) {
            edges {
              node {
                id
                name
                quantity
                image { url }
              }
            }
          }
          fulfillments {
            fulfillmentLineItems(first: 20) {
              edges {
                node {
                  id
                  quantity
                  lineItem { id }
                }
              }
            }
          }
          returns(first: 5) {
            edges {
              node { status }
            }
          }
        }
      }
    }
  }
`

const RETURN_CREATE_MUTATION = `
  mutation($returnInput: ReturnInput!) {
    returnCreate(returnInput: $returnInput) {
      return {
        id
        status
        order { name }
      }
      userErrors { field message }
    }
  }
`

export async function lookupOrder(
  orderNumber: string,
  customerName: string,
  skipNameCheck = false,
): Promise<{ order: OrderData } | { error: string }> {
  const num = orderNumber.replace(/^#/, '').trim()
  const { data } = await adminGql(LOOKUP_ORDER_QUERY, { query: `name:#${num}` })

  const node = data?.orders?.edges?.[0]?.node
  if (!node) {
    console.error('[lookupOrder] not found. query:', `name:#${num}`, 'response:', JSON.stringify(data))
    return { error: 'ORDER_NOT_FOUND' }
  }

  // 소유권 검증(공개 서버액션 방어): 로그인 고객이 '자기 주문'을 조회할 때만 내용을 반환.
  // 비소유자에겐 존재 여부도 흘리지 않도록 ORDER_NOT_FOUND로 통일. (dev는 로컬 OIDC 불가라 통과)
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    const customerId = await getCustomerId()
    const ownerId = node.customer?.id?.split('/').pop()
    if (!customerId || !ownerId || ownerId !== customerId) {
      return { error: 'ORDER_NOT_FOUND' }
    }
  }

  const nameCandidates = [
    node.shippingAddress?.name,
    node.shippingAddress?.firstName,
    node.shippingAddress?.lastName,
    node.customer?.displayName,
    node.customer?.firstName,
    node.customer?.lastName,
  ].filter(Boolean).map((s: string) => s.toLowerCase())

  const inputName = customerName.trim().toLowerCase()
  const nameMatch = skipNameCheck || nameCandidates.length === 0 || nameCandidates.some(
    (n) => n.includes(inputName) || inputName.includes(n)
  )
  if (!nameMatch) return { error: 'NAME_MISMATCH' }

  const activeReturnStatuses = new Set(['OPEN', 'IN_PROGRESS'])
  const hasActiveReturn = (node.returns?.edges ?? []).some(
    ({ node: r }: { node: { status: string } }) => activeReturnStatuses.has(r.status)
  )
  if (hasActiveReturn) return { error: 'RETURN_EXISTS' }

  // Build fulfillmentLineItemId map: lineItemId → fulfillmentLineItemId
  const fulfillmentMap = new Map<string, string>()
  for (const fulfillment of (node.fulfillments ?? [])) {
    for (const { node: fli } of (fulfillment.fulfillmentLineItems?.edges ?? [])) {
      fulfillmentMap.set(fli.lineItem.id, fli.id)
    }
  }

  const isFulfilled = fulfillmentMap.size > 0

  const gateways: string[] = (node.paymentGatewayNames ?? []).map((g: string) => g.toLowerCase())
  const isBankTransfer = gateways.some((g) => g === 'manual' || g.includes('bank') || g.includes('vbank'))
  const paymentMethod: OrderData['paymentMethod'] = isBankTransfer ? 'bank_transfer' : 'card'

  const lineItems: OrderLineItem[] = (node.lineItems?.edges ?? [])
    .map(({ node: li }: { node: { id: string; name: string; quantity: number; image: { url: string } | null } }) => ({
      lineItemId: li.id,
      fulfillmentLineItemId: fulfillmentMap.get(li.id) ?? null,
      name: li.name,
      quantity: li.quantity,
      image: li.image?.url ?? null,
    }))
    .filter((item: OrderLineItem) => item.fulfillmentLineItemId !== null)

  return {
    order: {
      id: node.id,
      name: node.name,
      createdAt: node.createdAt,
      isFulfilled,
      paymentMethod,
      lineItems,
    },
  }
}

export type ReturnItem = {
  fulfillmentLineItemId: string
  quantity: number
}

export type ReturnRequestInput = {
  orderId: string
  orderName: string
  customerName: string
  lang: string
  items: ReturnItem[]
  itemsLabel: string   // 표시용 상품명 요약
  reason: string
  note: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
}

export async function submitReturnRequest(
  input: ReturnRequestInput,
): Promise<{ success: true; returnName: string } | { error: string }> {
  // 소유권 검증(공개 서버액션 방어): orderId만 주면 남의 주문에 반품(환불계좌 포함)을 생성할 수
  // 있는 엔드포인트다 → 로그인 고객이 '자기 주문'에만 신청하도록 서버에서 강제. (dev는 통과)
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    const customerId = await getCustomerId()
    if (!customerId) return { error: 'UNAUTHORIZED' }
    const numericId = input.orderId.split('/').pop()
    const ownerRes = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'}/orders/${numericId}.json?fields=customer`,
      { headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN! }, cache: 'no-store' }
    )
    if (!ownerRes.ok) return { error: 'LOOKUP_FAILED' }
    const { order: owner } = await ownerRes.json()
    if (String(owner?.customer?.id ?? '') !== customerId) return { error: 'FORBIDDEN' }
  }

  const returnInput = {
    orderId: input.orderId,
    notifyCustomer: true,
    returnLineItems: input.items.map((item) => ({
      fulfillmentLineItemId: item.fulfillmentLineItemId,
      quantity: item.quantity,
      returnReason: input.reason,
      // ReturnLineItemInput의 메모 필드는 returnReasonNote. customerNote는 존재하지 않는
      // 필드라, 값이 들어가면 mutation 전체가 INVALID_VARIABLE로 실패한다(빈 메모는 undefined라
      // JSON에서 빠져 통과 → 메모 채운 반품만 깨지던 잠복 버그). 실 API 검증으로 발견.
      returnReasonNote: input.note || undefined,
    })),
  }

  const { data } = await adminGql(RETURN_CREATE_MUTATION, { returnInput })
  const userErrors = data?.returnCreate?.userErrors

  if (userErrors?.length) return { error: userErrors[0].message }

  const shopifyReturnId = data?.returnCreate?.return?.id ?? null

  // Supabase에 반품 신청 저장
  await supabaseAdmin.from('return_requests').insert({
    lang: input.lang,
    order_id: input.orderId,
    order_number: input.orderName,
    customer_name: input.customerName,
    items_json: input.itemsLabel,
    reason: input.reason,
    note: input.note || null,
    bank_name: input.bankName || null,
    account_number: input.accountNumber || null,
    account_holder: input.accountHolder || null,
    shopify_return_id: shopifyReturnId,
    status: 'pending',
  })

  return {
    success: true,
    returnName: data?.returnCreate?.return?.order?.name ?? '',
  }
}

export type ReturnStatus = 'pending' | 'approved' | 'received' | 'completed'

export async function updateReturnStatus(
  returnId: string,
  status: Exclude<ReturnStatus, 'pending'>,
) {
  await requireAdmin()
  await supabaseAdmin
    .from('return_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', returnId)

  if (status === 'completed') {
    const { data: r } = await supabaseAdmin
      .from('return_requests')
      .select('customer_name, order_number, refund_amount, lang')
      .eq('id', returnId)
      .single()

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && r) {
      // 환불완료 알림은 고객에게 발송한다. 수신 주소는 Shopify 주문의 email
      // (체크아웃에서 수집·저장됨). 이메일이 없는 과거 주문은 관리자 수신으로 폴백.
      let customerEmail: string | null = null
      try {
        const num = String(r.order_number).replace(/^#/, '')
        const { data } = await adminGql(
          `query($q: String!) { orders(first: 1, query: $q) { edges { node { email } } } }`,
          { q: `name:#${num}` },
        )
        customerEmail = data?.orders?.edges?.[0]?.node?.email ?? null
      } catch {
        // 조회 실패 시 관리자 폴백으로 진행
      }

      const isJa = r.lang === 'ja'
      const mail = customerEmail
        ? {
            to: customerEmail,
            bcc: process.env.ADMIN_EMAIL, // 관리자도 발송 기록 보관
            subject: isJa
              ? `【applebuttercollege】返品・返金完了のお知らせ（${r.order_number}）`
              : `[applebuttercollege] 반품 환불 완료 안내 (${r.order_number})`,
            html: isJa
              ? `<p>${r.customer_name} 様</p><p>ご注文 ${r.order_number} の返品・返金処理が完了いたしました。</p><p>返金の反映には決済手段により数日かかる場合がございます。</p><p>ご利用ありがとうございました。<br/>applebuttercollege</p>`
              : `<p>${r.customer_name}님, 안녕하세요.</p><p>주문 ${r.order_number}의 반품 환불 처리가 완료되었습니다.</p><p>결제수단에 따라 환불 반영까지 며칠 소요될 수 있습니다.</p><p>이용해 주셔서 감사합니다.<br/>applebuttercollege</p>`,
          }
        : {
            // 폴백: 고객 이메일이 없는 주문 → 관리자에게 알려 별도 안내(Q&A 답변 등) 유도
            to: process.env.ADMIN_EMAIL!,
            subject: `[반품 처리 완료 — 고객 이메일 없음] ${r.order_number}`,
            html: `<p>${r.customer_name}님의 ${r.order_number} 반품 환불이 완료 처리되었습니다.</p><p>⚠️ 주문에 고객 이메일이 없어 고객 알림이 발송되지 않았습니다. Q&A 답변 등으로 별도 안내가 필요합니다.</p>`,
          }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'applebuttercollege Support <support@applebuttercollege.com>',
          ...mail,
        }),
      })
    }
  }

  revalidatePath('/admin/returns')
}
