'use server'

import { supabaseAdmin } from '@/lib/supabase/client'
import { updateReturnStatus } from './returns'
import { requireAdmin } from '@/lib/utils/admin-auth'
import { adminGql } from '@/lib/shopify/admin'

export type RefundResult = { ok: true; warning?: string } | { error: string }

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!
const API_VERSION   = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'

// 불량/오배송: 전액 환불. 단순반품: 항상 7,000원 차감 (출고비 3,500 + 회수비 3,500).
//
// ⚠️ "무료배송이면 회수비만 차감" 같은 분기를 넣지 말 것 — 항상 -7,000이 양쪽 다 정답이다.
//   · 유료배송(8만 미만): 고객이 낸 출고비 3,500을 안 돌려줌 + 회수비 3,500 → 7,000
//   · 무료배송(8만 이상): 출고비 3,500을 새로 청구 + 회수비 3,500 → 7,000
//   부담 방식만 다를 뿐 금액은 동일하므로, 무료배송 분기 자체가 불필요하다.
//
// ⚠️ 혹시라도 분기가 필요해지면 무료배송 판단은 반드시 '상품합계(subtotal)' 기준으로 할 것.
//   여기 totalPaid는 배송비가 포함된 총결제대금이라, 79,000 상품이 82,500으로 잡혀
//   "8만 이상=무료배송"으로 오판한다.
const DEFECTIVE_REASONS = ['DEFECTIVE', 'WRONG_ITEM']
const SIMPLE_RETURN_DEDUCTION = 7000

function calcRefundAmount(totalPaid: number, reason: string): number {
  if (DEFECTIVE_REASONS.includes(reason)) return totalPaid
  return Math.max(0, totalPaid - SIMPLE_RETURN_DEDUCTION)
}

export type RefundPreview = {
  totalPaid: number
  refundAmount: number
  deduction: number
  paymentType: 'card' | 'bank_transfer'
  paymentKey: string | null
  refundBank: string | null
  refundAccount: string | null
  refundHolder: string | null
}

export async function getRefundPreview(
  orderName: string,
  reason: string,
): Promise<RefundPreview | null> {
  await requireAdmin()
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders.json?name=${encodeURIComponent(orderName)}&status=any&fields=total_price,note_attributes`,
    { headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }, cache: 'no-store' },
  )
  if (!res.ok) return null
  const json = await res.json()
  const order = json.orders?.[0]
  if (!order) return null

  const attrs: { name: string; value: string }[] = order.note_attributes ?? []
  const get = (key: string) => attrs.find((a) => a.name === key)?.value ?? null

  const totalPaid   = Math.round(Number(order.total_price))
  const refundAmount = calcRefundAmount(totalPaid, reason)
  const paymentKey  = get('toss_payment_key')
  const refundBank  = get('refund_bank')

  return {
    totalPaid,
    refundAmount,
    deduction: totalPaid - refundAmount,
    paymentType: refundBank ? 'bank_transfer' : 'card',
    paymentKey,
    refundBank,
    refundAccount: get('refund_account'),
    refundHolder:  get('refund_holder'),
  }
}

const REFUND_SYNC_QUERY = `
  query($orderId: ID!, $returnId: ID!) {
    order(id: $orderId) {
      transactions(first: 20) { id kind status gateway }
      fulfillments(first: 5) { location { id } }
    }
    return(id: $returnId) {
      status
      returnLineItems(first: 50) {
        nodes { ... on ReturnLineItem { quantity fulfillmentLineItem { lineItem { id } } } }
      }
    }
  }
`

// 2026-04부터 refundCreate는 @idempotent 필수. 키 = 반품건 id → 더블클릭·재시도에도 환불 1건.
const REFUND_CREATE_MUTATION = `
  mutation($input: RefundInput!, $key: String!) {
    refundCreate(input: $input) @idempotent(key: $key) {
      refund { id }
      userErrors { field message }
    }
  }
`

// 환불 완료(돈이 실제로 나간 뒤) Shopify에 반영: 환불 기록 + 반품 상품 재고 복원 + Return 닫기.
// 이게 없으면 Toss·DB만 환불되고 Shopify 주문은 PAID·Return은 OPEN으로 남아
// 매출 과대집계·재고 미복원·미처리 반품 누적이 생긴다(2026-09 카드 자동환불 실측에서 발견).
// 돈은 이미 나갔으므로 여기 실패는 환불 완료를 막지 않는다 → 경고 문자열로 돌려 관리자에게 표시.
async function syncShopifyRefund(returnId: string, amount: number): Promise<string | undefined> {
  const { data: row } = await supabaseAdmin
    .from('return_requests')
    .select('order_id, shopify_return_id')
    .eq('id', returnId)
    .single()
  if (!row?.order_id || !row.shopify_return_id) {
    return 'Shopify 반품 정보가 없어 Shopify 환불 기록을 남기지 못했습니다 — Shopify 관리자에서 직접 처리해 주세요.'
  }
  const orderId: string = row.order_id

  const { data } = await adminGql(REFUND_SYNC_QUERY, { orderId, returnId: row.shopify_return_id })
  const order = data?.order
  const ret = data?.return
  if (!order || !ret) return 'Shopify 주문/반품 조회 실패 — Shopify 관리자에서 환불을 직접 기록해 주세요.'
  if (ret.status === 'CLOSED') return undefined // 이미 처리됨

  const locationId: string | undefined = order.fulfillments?.[0]?.location?.id
  const sale = (order.transactions ?? []).find(
    (t: { kind: string; status: string }) => (t.kind === 'SALE' || t.kind === 'CAPTURE') && t.status === 'SUCCESS',
  )

  const refundLineItems = (ret.returnLineItems?.nodes ?? [])
    .filter((n: { fulfillmentLineItem?: { lineItem?: { id: string } } }) => n.fulfillmentLineItem?.lineItem?.id)
    .map((n: { quantity: number; fulfillmentLineItem: { lineItem: { id: string } } }) => ({
      lineItemId: n.fulfillmentLineItem.lineItem.id,
      quantity: n.quantity,
      ...(locationId ? { restockType: 'RETURN', locationId } : { restockType: 'NO_RESTOCK' }),
    }))

  // 금액은 실제로 돌려준 금액(차감 반영)을 거래로 기록 — 결제 거래(Toss)에 연결.
  // 원 결제 거래가 없으면(레거시 주문) 금액 기록은 생략하고 재고·반품만 처리.
  const transactions = sale && amount > 0
    ? [{ orderId, parentId: sale.id, gateway: sale.gateway, kind: 'REFUND', amount: String(amount) }]
    : []

  const { data: rc } = await adminGql(REFUND_CREATE_MUTATION, {
    input: { orderId, notify: false, note: '반품 환불', refundLineItems, transactions },
    key: `return-refund-${returnId}`,
  })
  const errs = rc?.refundCreate?.userErrors
  if (!rc?.refundCreate?.refund) {
    console.error('[syncShopifyRefund] refundCreate 실패:', returnId, JSON.stringify(errs))
    return `Shopify 환불 기록 실패(${errs?.[0]?.message ?? '알 수 없음'}) — Shopify 관리자에서 직접 기록해 주세요.`
  }

  // 환불 기록이 성공한 뒤에만 Return을 닫는다.
  const { data: cl } = await adminGql(
    `mutation($id: ID!) { returnClose(id: $id) { userErrors { message } } }`,
    { id: row.shopify_return_id },
  )
  if (cl?.returnClose?.userErrors?.length) {
    console.error('[syncShopifyRefund] returnClose 실패:', returnId, JSON.stringify(cl.returnClose.userErrors))
    return 'Shopify 환불은 기록됐으나 반품을 닫지 못했습니다 — Shopify 관리자에서 반품을 닫아 주세요.'
  }
  if (!sale && amount > 0) {
    return 'Shopify에 원 결제 거래가 없어 환불 금액은 기록되지 않았습니다(재고·반품은 처리됨).'
  }
  return undefined
}

// 실패는 throw하지 않고 { error }로 반환한다. 운영 빌드에서 서버 액션이 던진 에러는 Next가
// 메시지를 가려("An error occurred in the Server Components render…") 관리자가 Toss 거절 사유를
// 볼 수 없었다(2026-09 카드 자동환불 실측에서 발견). 반환값은 가려지지 않는다.
export async function processCardRefund(
  returnId: string,
  paymentKey: string,
  amount: number,
): Promise<RefundResult> {
  await requireAdmin()
  const tossSecret = process.env.TOSS_SECRET_KEY!
  let res: Response
  try {
    res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(tossSecret + ':').toString('base64'),
      },
      body: JSON.stringify({ cancelReason: '반품 환불', cancelAmount: amount }),
    })
  } catch (e) {
    console.error('[processCardRefund] Toss 호출 예외:', e)
    return { error: 'Toss 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' }
  }

  if (!res.ok) {
    const { code, message } = (await res.json().catch(() => ({}))) as { code?: string; message?: string }
    console.error('[processCardRefund] Toss 취소 거절:', res.status, code, message)
    return { error: `${message ?? 'Toss 환불 실패'}${code ? ` (${code})` : ''}` }
  }

  return markRefundCompleted(returnId, amount)
}

// 금액 기록 + 완료 처리(고객 완료메일 발송) + Shopify 반영. 3개 환불 경로의 공통 마무리.
// Toss API는 호출하지 않는다 — 여기 도달했으면 돈은 이미 나갔다(Toss 자동 취소 성공,
// 또는 은행 이체 / Toss 대시보드 수동 환불을 관리자가 마친 뒤).
async function markRefundCompleted(returnId: string, amount: number): Promise<RefundResult> {
  await supabaseAdmin
    .from('return_requests')
    .update({ refund_amount: amount })
    .eq('id', returnId)

  await updateReturnStatus(returnId, 'completed')
  const warning = await syncShopifyRefund(returnId, amount).catch((e) => {
    console.error('[syncShopifyRefund] 예외:', returnId, e)
    return 'Shopify 반영 중 오류 — Shopify 관리자에서 환불을 직접 기록해 주세요.'
  })
  return warning ? { ok: true, warning } : { ok: true }
}

// 가상계좌: 관리자가 계좌로 직접 이체한 뒤 완료 처리.
export async function completeBankRefund(returnId: string, amount: number): Promise<RefundResult> {
  await requireAdmin()
  return markRefundCompleted(returnId, amount)
}

// 카드인데 paymentKey가 없어 자동 환불 불가한 경우 — Toss 대시보드에서 수동 환불 후 완료 처리.
export async function completeManualRefund(returnId: string, amount: number): Promise<RefundResult> {
  await requireAdmin()
  return markRefundCompleted(returnId, amount)
}
