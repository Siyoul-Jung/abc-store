'use client'

import { useState, useTransition } from 'react'
import { createRefundRequest, updateRefundStatus } from '@/lib/actions/qa'
import type { RefundRequest } from '@/lib/supabase/types'

type Props = {
  questionId: string
  customerName: string
  customerEmail: string
  defaultOrderNumber: string
  refundRequest: RefundRequest | null
}

const statusLabels = { pending: '환불 대기', processing: '이체 처리 중', completed: '환불 완료' }
const statusColors = {
  pending: 'text-red-600 bg-red-50',
  processing: 'text-yellow-700 bg-yellow-50',
  completed: 'text-green-700 bg-green-50',
}

export default function AdminRefundPanel({
  questionId, customerName, customerEmail, defaultOrderNumber, refundRequest,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [pending, startTransition] = useTransition()

  if (refundRequest) {
    return (
      <div className="border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted">환불 처리</p>
          <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusColors[refundRequest.status]}`}>
            {statusLabels[refundRequest.status]}
          </span>
        </div>

        <div className="text-xs space-y-1.5 mb-4 text-ink-muted">
          <div className="flex justify-between"><span>주문번호</span><span className="text-ink font-medium">{refundRequest.order_number}</span></div>
          <div className="flex justify-between"><span>환불 금액</span><span className="text-ink font-medium">{refundRequest.refund_amount.toLocaleString()}원</span></div>
          {refundRequest.bank_name && (
            <>
              <div className="flex justify-between"><span>은행</span><span className="text-ink">{refundRequest.bank_name}</span></div>
              <div className="flex justify-between"><span>계좌번호</span><span className="text-ink">{refundRequest.account_number}</span></div>
              <div className="flex justify-between"><span>예금주</span><span className="text-ink">{refundRequest.account_holder}</span></div>
            </>
          )}
        </div>

        {refundRequest.status === 'pending' && (
          <div className="flex flex-col gap-2">
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              placeholder="메모 (선택)"
              className="w-full border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ink resize-none"
            />
            <button
              onClick={() => startTransition(async () => { await updateRefundStatus(refundRequest.id, 'processing', adminNote) })}
              disabled={pending}
              className="w-full py-2 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-40">
              이체 처리 시작
            </button>
          </div>
        )}

        {refundRequest.status === 'processing' && (
          <button
            onClick={() => startTransition(async () => { await updateRefundStatus(refundRequest.id, 'completed', adminNote) })}
            disabled={pending}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-40">
            {pending ? '처리 중...' : '이체 완료 → 고객 알림 발송'}
          </button>
        )}

        {refundRequest.status === 'completed' && (
          <p className="text-xs text-green-700 text-center py-1">고객에게 환불 완료 알림이 발송되었습니다.</p>
        )}
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl p-5">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-4">환불 처리</p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="w-full py-2.5 border border-border rounded-lg text-sm text-ink-muted hover:border-ink hover:text-ink transition-colors">
          + 환불 요청 등록
        </button>
      ) : (
        <form action={async (fd) => {
          await createRefundRequest(questionId, fd)
          setShowForm(false)
        }} className="flex flex-col gap-3">
          <input type="hidden" name="customer_name" value={customerName} />
          <input type="hidden" name="customer_email" value={customerEmail} />

          <div>
            <label className="text-xs text-ink-muted block mb-1">주문번호</label>
            <input type="text" name="order_number" defaultValue={defaultOrderNumber} required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </div>
          <div>
            <label className="text-xs text-ink-muted block mb-1">환불 금액 (원)</label>
            <input type="number" name="refund_amount" required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </div>
          {/* Q&A 환불은 항상 무통장(가상계좌) 이체 → 계좌 3필드 필수. 누락 시 환불 불가. */}
          <div>
            <label className="text-xs text-ink-muted block mb-1">은행명 <span className="text-coral">*</span></label>
            <input type="text" name="bank_name" placeholder="예: 국민은행" required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </div>
          <div>
            <label className="text-xs text-ink-muted block mb-1">계좌번호 <span className="text-coral">*</span></label>
            <input type="text" name="account_number" required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </div>
          <div>
            <label className="text-xs text-ink-muted block mb-1">예금주 <span className="text-coral">*</span></label>
            <input type="text" name="account_holder" required
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-ink" />
          </div>
          <input type="hidden" name="payment_type" value="bank_transfer" />

          <div className="flex gap-2 mt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-2 border border-border rounded-lg text-sm text-ink-muted hover:border-ink transition-colors">
              취소
            </button>
            <button type="submit"
              className="flex-1 py-2 bg-ink text-white rounded-lg text-sm font-medium hover:opacity-80">
              등록
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
