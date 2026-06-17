'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelOrder } from '@/lib/actions/account'
import type { Locale } from '@/lib/shopify/types'

// 주문 취소 확인 모달 — 파괴적·비가역(환불) 액션이라 의도적 확인 + 결과 고지를 함께 제공.
// 목록/상세 두 곳에서 공용으로 쓰되, 트리거 버튼 스타일·라벨만 호출부에서 주입한다.
type Props = {
  orderId: string
  locale: Locale
  triggerLabel: string
  triggerClassName: string
}

const T: Record<Locale, {
  title: string; desc: string; confirm: string; close: string; cancelled: string; error: string
}> = {
  ko: {
    title: '주문을 취소할까요?',
    desc: '결제 금액이 전액 환불됩니다.',
    confirm: '주문 취소하기', close: '닫기', cancelled: '취소 완료', error: '취소에 실패했어요. 잠시 후 다시 시도해 주세요.',
  },
  ja: {
    title: 'ご注文をキャンセルしますか？',
    desc: 'ご決済金額が全額返金されます。',
    confirm: 'キャンセルする', close: '閉じる', cancelled: 'キャンセル済み', error: 'キャンセルに失敗しました。しばらくしてから再度お試しください。',
  },
  en: {
    title: 'Cancel this order?',
    desc: 'Your payment will be refunded in full.',
    confirm: 'Cancel order', close: 'Close', cancelled: 'Cancelled', error: 'Cancellation failed. Please try again shortly.',
  },
}

export default function CancelOrderModal({ orderId, locale, triggerLabel, triggerClassName }: Props) {
  const t = T[locale]
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // 열려 있을 때 ESC 닫기 + 배경 스크롤 잠금 (SizeGuideModal/PolicyModal과 동일 관행)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pending) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, pending])

  if (done) {
    return <span className="text-[11px] text-ink-muted">{t.cancelled}</span>
  }

  function handleConfirm() {
    setError('')
    startTransition(async () => {
      const result = await cancelOrder(orderId)
      if ('error' in result && result.error) {
        setError(t.error)
        return
      }
      setOpen(false)
      setDone(true)
      router.refresh()
    })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => { if (!pending) setOpen(false) }}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold">{t.title}</h2>
              <p className="text-sm text-ink-muted leading-relaxed break-keep">{t.desc}</p>
            </div>

            {error && <p className="text-xs text-coral">{error}</p>}

            <div className="flex flex-col gap-2 mt-1">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="w-full bg-coral text-white text-sm font-medium py-3 rounded-full hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {pending ? '···' : t.confirm}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="w-full text-sm text-ink-muted py-2 hover:text-ink disabled:opacity-40 transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
