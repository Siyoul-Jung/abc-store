'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { unlockGuestQuestion, sendQuestionAccessLink } from '@/lib/actions/qa'
import type { Locale } from '@/lib/shopify/types'

const t: Record<Locale, {
  heading: string; desc: string; placeholder: string; submit: string
  wrong: string; forgot: string; sent: string
}> = {
  ko: {
    heading: '비공개 문의',
    desc: '작성 시 설정한 비밀번호를 입력해 주세요.',
    placeholder: '글 비밀번호',
    submit: '확인',
    wrong: '비밀번호가 일치하지 않습니다.',
    forgot: '비밀번호를 잊으셨나요? 이메일로 열람 링크 받기',
    sent: '작성 시 입력한 이메일로 열람 링크를 보냈습니다. (24시간 유효)',
  },
  ja: {
    heading: '非公開のお問い合わせ',
    desc: '作成時に設定したパスワードをご入力ください。',
    placeholder: '閲覧パスワード',
    submit: '確認',
    wrong: 'パスワードが一致しません。',
    forgot: 'パスワードをお忘れですか？ メールで閲覧リンクを受け取る',
    sent: '作成時のメールアドレスに閲覧リンクを送信しました。（24時間有効）',
  },
  en: {
    heading: 'Private inquiry',
    desc: 'Enter the password you set when posting.',
    placeholder: 'Post password',
    submit: 'View',
    wrong: 'Incorrect password.',
    forgot: 'Forgot your password? Get a view link by email',
    sent: 'We sent a view link to the email you used. (valid 24h)',
  },
}

export default function GuestAccessGate({ questionId, lang, title }: { questionId: string; lang: Locale; title: string }) {
  const labels = t[lang]
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await unlockGuestQuestion(questionId, password)
      if (res.ok) router.refresh()
      else setError(labels.wrong)
    })
  }

  function forgot() {
    startTransition(async () => {
      await sendQuestionAccessLink(questionId, lang)
      setSent(true)
    })
  }

  return (
    <div className="mt-10 max-w-sm mx-auto text-center">
      <p className="text-[11px] tracking-[0.15em] uppercase text-ink-muted mb-2">🔒 {labels.heading}</p>
      <h1 className="text-base font-semibold mb-1 break-keep">{title}</h1>
      <p className="text-sm text-ink-muted mb-6">{labels.desc}</p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={labels.placeholder}
          autoComplete="current-password"
          className="w-full border border-border rounded-lg px-4 py-3 text-sm text-center focus:outline-none focus:border-ink transition-colors"
        />
        {error && <p className="text-xs text-coral">{error}</p>}
        <button
          type="submit"
          disabled={pending || !password}
          className="w-full py-3 bg-ink text-white rounded-full text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {pending ? '...' : labels.submit}
        </button>
      </form>

      {sent ? (
        <p className="text-xs text-ink-muted mt-5 leading-relaxed">{labels.sent}</p>
      ) : (
        <button
          type="button"
          onClick={forgot}
          disabled={pending}
          className="text-xs text-ink-muted underline underline-offset-4 hover:text-ink transition-colors mt-5 disabled:opacity-40"
        >
          {labels.forgot}
        </button>
      )}
    </div>
  )
}
