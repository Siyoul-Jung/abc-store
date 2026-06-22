'use client'

import { useTransition } from 'react'
import { updateReturnStatus } from '@/lib/actions/returns'
import { processCardRefund, completeBankRefund, completeManualRefund } from '@/lib/actions/refund'
import type { RefundPreview } from '@/lib/actions/refund'

export default function AdminReturnActions({
  returnId,
  status,
  hasBankInfo,
  refundPreview,
}: {
  returnId: string
  status: string
  hasBankInfo: boolean
  refundPreview: RefundPreview | null
}) {
  const [pending, startTransition] = useTransition()

  if (status === 'completed') {
    return <p className="text-xs text-green-700">✓ 환불 완료 처리됨</p>
  }

  if (status === 'received') {
    if (!refundPreview) {
      return (
        <div className="flex gap-2 flex-wrap items-center">
          <p className="text-xs text-ink-muted">Shopify 주문 정보를 불러올 수 없습니다.</p>
          {hasBankInfo && (
            <button
              onClick={() => startTransition(() => completeBankRefund(returnId, 0))}
              disabled={pending}
              className="text-xs px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-80 disabled:opacity-40">
              {pending ? '처리 중...' : '이체 완료 → 환불완료'}
            </button>
          )}
        </div>
      )
    }

    const isCard = refundPreview.paymentType === 'card'

    return (
      <div className="flex flex-col gap-3">
        {/* 환불 금액 계산 요약 */}
        <div className="text-xs bg-surface rounded-lg px-3 py-2.5 space-y-1">
          <div className="flex justify-between text-ink-muted">
            <span>결제 금액</span>
            <span>{refundPreview.totalPaid.toLocaleString()}원</span>
          </div>
          {refundPreview.deduction > 0 && (
            <div className="flex justify-between text-ink-muted">
              <span>차감 ({refundPreview.deduction === 7000 ? '출고비 3,500 + 회수비 3,500' : '불량 전액'})</span>
              <span>−{refundPreview.deduction.toLocaleString()}원</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-ink border-t border-border pt-1 mt-1">
            <span>환불 금액</span>
            <span>{refundPreview.refundAmount.toLocaleString()}원</span>
          </div>
          <div className="text-ink-muted pt-0.5">
            결제 수단: {isCard ? '카드 (Toss 자동 환불)' : '가상계좌 (수동 이체)'}
          </div>
        </div>

        {isCard ? (
          /* 카드: Toss API 자동 환불 */
          refundPreview.paymentKey ? (
            <button
              onClick={() =>
                startTransition(async () => {
                  try {
                    await processCardRefund(returnId, refundPreview.paymentKey!, refundPreview.refundAmount)
                  } catch (e) {
                    alert((e as Error).message)
                  }
                })
              }
              disabled={pending}
              className="text-xs px-4 py-2.5 bg-coral text-white rounded-lg hover:opacity-80 disabled:opacity-40 font-medium">
              {pending ? '환불 처리 중...' : `카드 자동 환불 ${refundPreview.refundAmount.toLocaleString()}원`}
            </button>
          ) : (
            /* paymentKey 없음(레거시·수동 생성 주문 등) → 자동 환불 불가.
               Toss 대시보드에서 직접 환불 후 수동 완료 처리해 관리자가 막히지 않게. */
            <div className="flex flex-col gap-2">
              <p className="text-xs text-red-600">
                자동 환불 불가 (paymentKey 없음) — Toss 대시보드에서 직접 환불한 뒤 아래 버튼으로 완료 처리하세요.
              </p>
              <button
                onClick={() => startTransition(() => completeManualRefund(returnId, refundPreview.refundAmount))}
                disabled={pending}
                className="text-xs px-4 py-2.5 bg-green-600 text-white rounded-lg hover:opacity-80 disabled:opacity-40 font-medium">
                {pending ? '처리 중...' : `수동 환불 완료 처리 ${refundPreview.refundAmount.toLocaleString()}원`}
              </button>
            </div>
          )
        ) : (
          /* 가상계좌: 수동 이체 후 완료 처리 */
          <div className="flex flex-col gap-2">
            <div className="text-xs border border-border rounded-lg px-3 py-2 space-y-1">
              <p className="text-ink-muted font-medium">이체 계좌</p>
              <p>{refundPreview.refundBank} {refundPreview.refundAccount} ({refundPreview.refundHolder})</p>
              <p className="text-ink font-semibold">이체 금액: {refundPreview.refundAmount.toLocaleString()}원</p>
            </div>
            <button
              onClick={() => startTransition(() => completeBankRefund(returnId, refundPreview.refundAmount))}
              disabled={pending}
              className="text-xs px-4 py-2.5 bg-green-600 text-white rounded-lg hover:opacity-80 disabled:opacity-40 font-medium">
              {pending ? '처리 중...' : '이체 완료 → 환불완료'}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (status === 'approved') {
    return (
      <button
        onClick={() => startTransition(() => updateReturnStatus(returnId, 'received'))}
        disabled={pending}
        className="text-xs px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-80 disabled:opacity-40">
        {pending ? '...' : '물건 수령 확인'}
      </button>
    )
  }

  // pending
  return (
    <button
      onClick={() => startTransition(() => updateReturnStatus(returnId, 'approved'))}
      disabled={pending}
      className="text-xs px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-80 disabled:opacity-40">
      {pending ? '...' : '반품 승인 (회수 준비)'}
    </button>
  )
}
