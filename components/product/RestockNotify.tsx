'use client'

import { useState, useTransition } from 'react'
import type { Locale } from '@/lib/shopify/types'
import { subscribeRestock } from '@/lib/actions/restock'

type Props = {
  productId: string
  productTitle: string
  variantId: string
  variantTitle: string
  locale: Locale
}

const t: Record<Locale, {
  prompt: string; placeholder: string; submit: string; sending: string
  done: string; already: string; invalid: string; error: string
}> = {
  ko: {
    prompt: '재입고되면 알려드릴까요?',
    placeholder: '이메일 주소',
    submit: '재입고 알림 신청',
    sending: '신청 중…',
    done: '신청 완료! 재입고되면 이메일로 알려드릴게요.',
    already: '이미 신청하신 상품이에요. 재입고되면 알려드릴게요.',
    invalid: '이메일 주소를 확인해 주세요.',
    error: '잠시 후 다시 시도해 주세요.',
  },
  ja: {
    prompt: '再入荷したらお知らせしますか？',
    placeholder: 'メールアドレス',
    submit: '再入荷通知を申し込む',
    sending: '送信中…',
    done: 'お申し込み完了！再入荷したらメールでお知らせします。',
    already: 'すでにお申し込み済みです。再入荷したらお知らせします。',
    invalid: 'メールアドレスをご確認ください。',
    error: 'しばらくしてからもう一度お試しください。',
  },
  en: {
    prompt: 'Notify me when back in stock?',
    placeholder: 'Email address',
    submit: 'Notify me',
    sending: 'Sending…',
    done: "You're on the list! We'll email you when it's back.",
    already: "You're already on the list. We'll email you when it's back.",
    invalid: 'Please check your email address.',
    error: 'Please try again in a moment.',
  },
}

export default function RestockNotify({ productId, productTitle, variantId, variantTitle, locale }: Props) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'done' | 'already' | 'invalid' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()
  const d = t[locale]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPending) return
    startTransition(async () => {
      const res = await subscribeRestock({ productId, productTitle, variantId, variantTitle, email, lang: locale })
      if ('error' in res) {
        setStatus(res.error === 'invalid_email' ? 'invalid' : 'error')
      } else {
        setStatus(res.already ? 'already' : 'done')
      }
    })
  }

  if (status === 'done' || status === 'already') {
    return (
      <p className="text-xs text-ink leading-relaxed border border-border bg-surface px-4 py-3">
        {status === 'done' ? d.done : d.already}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-xs text-ink-muted">{d.prompt}</p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status !== 'idle') setStatus('idle') }}
          placeholder={d.placeholder}
          className="flex-1 min-w-0 border border-border px-3 py-2.5 text-sm focus:border-ink outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 px-4 py-2.5 text-xs font-medium tracking-wide border border-ink hover:bg-ink hover:text-white transition-colors disabled:opacity-50"
        >
          {isPending ? d.sending : d.submit}
        </button>
      </div>
      {(status === 'invalid' || status === 'error') && (
        <p className="text-xs text-coral">{status === 'invalid' ? d.invalid : d.error}</p>
      )}
    </form>
  )
}
