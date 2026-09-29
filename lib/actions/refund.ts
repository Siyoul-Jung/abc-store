'use server'

import { supabaseAdmin } from '@/lib/supabase/client'
import { updateReturnStatus } from './returns'
import { requireAdmin } from '@/lib/utils/admin-auth'

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

// 실패는 throw하지 않고 { error }로 반환한다. 운영 빌드에서 서버 액션이 던진 에러는 Next가
// 메시지를 가려("An error occurred in the Server Components render…") 관리자가 Toss 거절 사유를
// 볼 수 없었다(2026-09 카드 자동환불 실측에서 발견). 반환값은 가려지지 않는다.
export async function processCardRefund(
  returnId: string,
  paymentKey: string,
  amount: number,
): Promise<{ ok: true } | { error: string }> {
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

  await supabaseAdmin
    .from('return_requests')
    .update({ refund_amount: amount })
    .eq('id', returnId)

  await updateReturnStatus(returnId, 'completed')
  return { ok: true }
}

// 금액 기록 + 완료 처리(고객 완료메일 발송). Toss API는 호출하지 않는다 —
// 실제 송금은 외부(은행 이체 / Toss 대시보드 수동 환불)에서 이미 했다는 전제.
async function markRefundCompleted(returnId: string, amount: number) {
  await supabaseAdmin
    .from('return_requests')
    .update({ refund_amount: amount })
    .eq('id', returnId)

  await updateReturnStatus(returnId, 'completed')
}

// 가상계좌: 관리자가 계좌로 직접 이체한 뒤 완료 처리.
export async function completeBankRefund(returnId: string, amount: number) {
  await requireAdmin()
  await markRefundCompleted(returnId, amount)
}

// 카드인데 paymentKey가 없어 자동 환불 불가한 경우 — Toss 대시보드에서 수동 환불 후 완료 처리.
export async function completeManualRefund(returnId: string, amount: number) {
  await requireAdmin()
  await markRefundCompleted(returnId, amount)
}
