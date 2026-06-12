'use server'

import { supabaseAdmin } from '@/lib/supabase/client'
import { updateReturnStatus } from './returns'

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

export async function processCardRefund(returnId: string, paymentKey: string, amount: number) {
  const tossSecret = process.env.TOSS_SECRET_KEY!
  const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(tossSecret + ':').toString('base64'),
    },
    body: JSON.stringify({ cancelReason: '반품 환불', cancelAmount: amount }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Toss 환불 실패')
  }

  await supabaseAdmin
    .from('return_requests')
    .update({ refund_amount: amount })
    .eq('id', returnId)

  await updateReturnStatus(returnId, 'completed')
}

export async function completeBankRefund(returnId: string, amount: number) {
  await supabaseAdmin
    .from('return_requests')
    .update({ refund_amount: amount })
    .eq('id', returnId)

  await updateReturnStatus(returnId, 'completed')
}
