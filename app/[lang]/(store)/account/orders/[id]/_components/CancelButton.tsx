'use client'

import { useTransition } from 'react'
import { cancelOrder } from '@/lib/actions/account'

export default function CancelButton({
  orderId,
  confirmMessage,
  label,
}: {
  orderId: string
  confirmMessage: string
  label: string
}) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (!confirm(confirmMessage)) return
        startTransition(async () => {
          const result = await cancelOrder(orderId)
          if (result.error) alert(result.error)
        })
      }}
      disabled={pending}
      className="w-full text-center text-sm py-3 border border-border rounded-lg text-ink-muted hover:border-coral hover:text-coral transition-colors disabled:opacity-40"
    >
      {pending ? '...' : label}
    </button>
  )
}
