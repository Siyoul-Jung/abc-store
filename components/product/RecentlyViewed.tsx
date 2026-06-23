'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/format'
import type { Locale } from '@/lib/shopify/types'

// 최근 본 상품 — localStorage 기반. 서버 데이터 없이 클라이언트에서만 동작.
// 상세 페이지 진입 시 current를 목록 맨 앞에 기록하고(중복 제거, 최대 12개),
// current를 제외한 나머지를 가로 스크롤로 보여준다.

const KEY = 'recently_viewed'
const MAX = 12

export type RecentItem = {
  numericId: string
  title: string
  image: string | null
  amount: string
  currencyCode: string
}

const LABEL: Record<Locale, string> = {
  ko: '최근 본 상품',
  ja: '最近見た商品',
  en: 'Recently viewed',
}

export default function RecentlyViewed({ current, lang }: { current: RecentItem; lang: Locale }) {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    let list: RecentItem[] = []
    try {
      list = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    } catch {
      list = []
    }
    // current 제외 후 맨 앞에 추가 → 중복 제거 → 캡
    const next = [current, ...list.filter((it) => it.numericId !== current.numericId)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(next))
    // 화면에는 current를 빼고 표시
    setItems(next.filter((it) => it.numericId !== current.numericId))
  }, [current])

  if (items.length === 0) return null

  return (
    <section className="mt-16 px-4 sm:px-0">
      <h2 className="text-sm font-bold tracking-widest uppercase mb-6">{LABEL[lang]}</h2>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {items.map((it) => (
          <Link
            key={it.numericId}
            href={`/${lang}/products/${it.numericId}`}
            className="group shrink-0 w-32 sm:w-40 snap-start"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden mb-2 bg-surface">
              {it.image && (
                <Image
                  src={it.image}
                  alt={it.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              )}
            </div>
            <p className="text-[12px] font-medium text-ink leading-snug line-clamp-2 break-keep">
              {it.title}
            </p>
            <p className="text-[12px] text-ink-muted mt-0.5">
              {formatPrice(it.amount, it.currencyCode, lang)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
