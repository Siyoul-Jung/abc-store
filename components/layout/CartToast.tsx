'use client'

import { useState, useEffect, useRef } from 'react'
import type { Locale } from '@/lib/shopify/types'

const MESSAGES: Record<Locale, string> = {
  ko: '장바구니에 담았습니다',
  ja: 'カートに追加しました',
  en: 'Added to cart',
}

export default function CartToast({ lang }: { lang: Locale }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onAdded = () => {
      setVisible(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), 2000)
    }
    window.addEventListener('cart:updated', onAdded)
    return () => {
      window.removeEventListener('cart:updated', onAdded)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div
      aria-live="polite"
      className={`fixed left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 ${
        visible
          ? 'bottom-6 opacity-100 translate-y-0'
          : 'bottom-2 opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-2 bg-ink text-white text-sm px-5 py-3 rounded-full shadow-lg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {MESSAGES[lang] ?? MESSAGES.ko}
      </div>
    </div>
  )
}
