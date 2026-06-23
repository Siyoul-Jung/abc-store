'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// 공지/이벤트 배너 — 콘텐츠 상단 풀폭 스트립.
// 문구는 환경변수(NEXT_PUBLIC_NOTICE_KO / _JA)로 관리 → 코드 수정 없이 운영자가 교체.
// 비어 있으면 렌더하지 않음. 닫으면 같은 문구는 다시 안 뜸(문구가 바뀌면 다시 노출).

const KEY = 'notice_dismissed'

export default function NoticeBanner({ text, href }: { text?: string; href?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!text) return
    const dismissed = localStorage.getItem(KEY)
    setVisible(dismissed !== text)
  }, [text])

  if (!text || !visible) return null

  const inner = <span className="break-keep">{text}</span>

  return (
    <div className="relative bg-ink text-white text-xs sm:text-[13px]">
      <div className="max-w-7xl mx-auto px-10 py-2.5 text-center leading-relaxed">
        {href ? (
          <Link href={href} className="underline underline-offset-2 hover:opacity-80 transition-opacity">
            {inner}
          </Link>
        ) : (
          inner
        )}
      </div>
      <button
        type="button"
        onClick={() => { localStorage.setItem(KEY, text); setVisible(false) }}
        aria-label="close"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-base leading-none"
      >
        ×
      </button>
    </div>
  )
}
