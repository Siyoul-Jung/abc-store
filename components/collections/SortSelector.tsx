'use client'

import { useRouter, usePathname } from 'next/navigation'

const OPTIONS = [
  { value: 'newest',       ko: '신상순',     ja: '新着順' },
  { value: 'price_asc',    ko: '가격 낮은순', ja: '低価格順' },
  { value: 'price_desc',   ko: '가격 높은순', ja: '高価格順' },
  { value: 'best_selling', ko: '인기순',     ja: '人気順' },
]

type Props = { lang: string; current: string }

export default function SortSelector({ lang, current }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(value: string) {
    router.push(value === 'newest' ? pathname : `${pathname}?sort=${value}`)
  }

  return (
    <select
      value={current}
      onChange={(e) => handleChange(e.target.value)}
      className="text-xs text-ink-muted border border-border bg-white px-3 py-1.5 focus:outline-none cursor-pointer hover:border-ink transition-colors"
    >
      {OPTIONS.map(({ value, ko, ja }) => (
        <option key={value} value={value}>
          {lang === 'ja' ? ja : ko}
        </option>
      ))}
    </select>
  )
}
