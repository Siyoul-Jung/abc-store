'use client'

import { useEffect } from 'react'
import SizeGuide from '@/components/product/SizeGuide'
import type { Locale } from '@/lib/shopify/types'

type Props = { locale: Locale; onClose: () => void }

export default function SizeGuideModal({ locale, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
          <span className="text-sm font-bold tracking-widest uppercase">
            {locale === 'ko' ? '사이즈 가이드' : 'サイズガイド'}
          </span>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-xl leading-none"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">
          <SizeGuide locale={locale} hideHeader />
        </div>
      </div>
    </div>
  )
}
