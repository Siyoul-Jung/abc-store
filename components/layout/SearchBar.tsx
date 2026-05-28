'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { gidToNumericId, formatPrice } from '@/lib/utils/format'
import type { Locale } from '@/lib/shopify/types'

type SearchProduct = {
  id: string
  title: string
  featuredImage: { url: string; altText: string | null } | null
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } }
}

export default function SearchBar({ lang }: { lang: Locale }) {
  const router                = useRouter()
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}`)
      const data = await res.json()
      setResults(data.products ?? [])
    } finally {
      setLoading(false)
    }
  }, [lang])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(q), 300)
  }

  const close = () => {
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    close()
    router.push(`/${lang}/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      {/* 검색 아이콘 */}
      <button
        onClick={() => setOpen(true)}
        aria-label="검색"
        className="text-ink hover:opacity-60 transition-opacity"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>

      {/* 검색 오버레이 */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/20"
            onClick={close}
          />
          <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-muted shrink-0">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="상품 검색..."
                className="flex-1 text-sm text-ink placeholder:text-ink-muted outline-none bg-transparent"
              />
              <button onClick={close} className="text-ink-muted hover:text-ink transition-colors text-lg leading-none">
                ✕
              </button>
            </form>

            {/* 검색 결과 */}
            {query.trim().length > 0 && (
              <div className="max-w-2xl mx-auto px-6 pb-4">
                {loading && (
                  <p className="text-xs text-ink-muted py-4">검색 중...</p>
                )}
                {!loading && results.length === 0 && (
                  <p className="text-xs text-ink-muted py-4">결과가 없습니다.</p>
                )}
                {!loading && results.length > 0 && (
                  <ul className="divide-y divide-border">
                    {results.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/${lang}/products/${gidToNumericId(product.id)}`}
                          onClick={close}
                          className="flex items-center gap-4 py-3 hover:opacity-70 transition-opacity"
                        >
                          <div className="relative w-12 h-12 shrink-0 bg-surface overflow-hidden">
                            {product.featuredImage && (
                              <Image
                                src={product.featuredImage.url}
                                alt={product.featuredImage.altText ?? product.title}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{product.title}</p>
                            <p className="text-xs text-ink-muted mt-0.5">
                              {formatPrice(
                                product.priceRange.minVariantPrice.amount,
                                product.priceRange.minVariantPrice.currencyCode,
                                lang,
                              )}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
