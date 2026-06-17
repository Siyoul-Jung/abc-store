'use client'

import { useState, useTransition } from 'react'

// 배송지 삭제 — 파괴적 액션이라 한 번 더 확인받는다(모바일 오탭 방지).
// onDelete는 deleteAddress.bind(null, id)로 묶인 서버액션.

type Props = {
  onDelete: () => Promise<{ success?: boolean; error?: string }>
  labels: { delete: string; confirm: string; cancel: string }
}

export default function DeleteAddressButton({ onDelete, labels }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-ink-muted hover:text-coral transition-colors"
      >
        {labels.delete}
      </button>
    )
  }

  return (
    <span className="flex items-center gap-3 text-xs">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await onDelete() })}
        className="text-coral font-medium hover:opacity-70 transition-opacity disabled:opacity-50"
      >
        {labels.confirm}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-ink-muted hover:text-ink transition-colors"
      >
        {labels.cancel}
      </button>
    </span>
  )
}
