'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-center py-6 border-b border-border">
        <Link href="/" className="block outline-none hover:opacity-60 transition-opacity">
          <Image src="/logo.png" alt="applebuttercollege" width={240} height={36} className="block h-9 w-auto object-contain" />
        </Link>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="font-display text-[96px] sm:text-[140px] leading-none font-bold text-border select-none">
          500
        </p>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-ink">일시적인 오류가 발생했어요</p>
          <p className="text-xs text-ink-muted">
            잠시 후 다시 시도해 주세요.
            <br />
            <span className="text-ink-muted/70">一時的なエラーが発生しました。</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="text-xs underline underline-offset-4 text-ink hover:opacity-70 transition-opacity"
          >
            다시 시도
          </button>
          <span className="text-border">|</span>
          <Link
            href="/"
            className="text-xs underline underline-offset-4 text-ink-muted hover:text-ink transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </div>
  )
}
