'use client'

import { useState, useTransition } from 'react'
import { cancelOrder } from '@/lib/actions/account'

type Labels = { cancel: string; confirm: string; no: string; cancelled: string; error: string }

export default function CancelOrderButton({ orderId, labels }: { orderId: string; labels: Labels }) {
  const [state, setState] = useState<'idle' | 'confirming' | 'done' | 'error'>('idle')
  const [pending, startTransition] = useTransition()

  if (state === 'done') {
    return <span className="text-[11px] text-ink-muted">{labels.cancelled}</span>
  }

  if (state === 'confirming') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            startTransition(async () => {
              const result = await cancelOrder(orderId)
              setState('error' in result ? 'error' : 'done')
            })
          }
          disabled={pending}
          className="text-[11px] text-white bg-coral rounded-full px-3 py-1 hover:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {pending ? '···' : labels.confirm}
        </button>
        <button
          onClick={() => setState('idle')}
          disabled={pending}
          className="text-[11px] text-ink-muted hover:text-ink transition-colors"
        >
          {labels.no}
        </button>
      </div>
    )
  }

  if (state === 'error') {
    return <span className="text-[11px] text-coral">{labels.error}</span>
  }

  return (
    <button
      onClick={() => setState('confirming')}
      className="text-[11px] text-ink-muted hover:text-coral border border-border rounded-full px-3 py-1 transition-colors"
    >
      {labels.cancel}
    </button>
  )
}
