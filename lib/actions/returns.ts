'use server'

import { revalidatePath } from 'next/cache'
import { adminGql } from '@/lib/shopify/admin'
import { supabaseAdmin } from '@/lib/supabase/client'

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
          customer { displayName firstName lastName }
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
  const returnInput = {
    orderId: input.orderId,
    notifyCustomer: true,
    returnLineItems: input.items.map((item) => ({
      fulfillmentLineItemId: item.fulfillmentLineItemId,
      quantity: item.quantity,
      returnReason: input.reason,
      customerNote: input.note || undefined,
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
  await supabaseAdmin
    .from('return_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', returnId)

  if (status === 'completed') {
    const { data: r } = await supabaseAdmin
      .from('return_requests')
      .select('customer_name, order_number, bank_name, account_number, refund_amount')
      .eq('id', returnId)
      .single()

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && r) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'applebuttercollege CS <cs@applebuttercollege.com>',
          to: process.env.ADMIN_EMAIL!,
          subject: `[반품 처리 완료] ${r.order_number}`,
          html: `<p>${r.customer_name}님의 ${r.order_number} 반품 환불이 완료 처리되었습니다.</p>`,
        }),
      })
    }
  }

  revalidatePath('/admin/returns')
}
