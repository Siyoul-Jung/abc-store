'use client'

import { useTransition } from 'react'
import { updateReturnStatus } from '@/lib/actions/returns'

export default function AdminReturnActions({
  returnId,
  status,
  hasBankInfo,
}: {
  returnId: string
  status: string
  hasBankInfo: boolean
}) {
  const [pending, startTransition] = useTransition()

  if (status === 'completed') {
    return <p className="text-xs text-green-700">✓ 환불 완료 처리됨</p>
  }

  if (status === 'received') {
    return (
      <div className="flex gap-2 flex-wrap items-center">
        {hasBankInfo ? (
          <button
            onClick={() => startTransition(() => updateReturnStatus(returnId, 'completed'))}
            disabled={pending}
            className="text-xs px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity">
            {pending ? '처리 중...' : '이체 완료 → 환불완료'}
          </button>
        ) : (
          <p className="text-xs text-ink-muted">카드결제 — 카드 자동 환불 처리 필요</p>
        )}
      </div>
    )
  }

  if (status === 'approved') {
    return (
      <button
        onClick={() => startTransition(() => updateReturnStatus(returnId, 'received'))}
        disabled={pending}
        className="text-xs px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity">
        {pending ? '...' : '물건 수령 확인'}
      </button>
    )
  }

  // pending
  return (
    <button
      onClick={() => startTransition(() => updateReturnStatus(returnId, 'approved'))}
      disabled={pending}
      className="text-xs px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-80 disabled:opacity-40 transition-opacity">
      {pending ? '...' : '반품 승인 (회수 준비)'}
    </button>
  )
}
