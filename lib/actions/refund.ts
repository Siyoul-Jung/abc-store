'use server'

import { supabaseAdmin } from '@/lib/supabase/client'
import { updateReturnStatus } from './returns'

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!
const API_VERSION   = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'

// 불량/오배송: 전액, 단순반품: 출고비 3500 + 회수비 3500 = 7000 차감
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
