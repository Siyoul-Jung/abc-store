'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { addToCart } from '@/lib/actions/cart'
import { stripTitlePrefix, formatPrice } from '@/lib/utils/format'
import type { Product, Locale } from '@/lib/shopify/types'

type Props = {
  product: Product
  lang: Locale
  soldOut: boolean
}

const labels = {
  ko: {
    add: '담기',
    adding: '담는 중...',
    added: '담겼어요 ✓',
    soldOut: '품절',
    selectSize: '사이즈 선택',
    close: '닫기',
    confirm: '장바구니 담기',
    shipping: '배송',
    sale: '세일',
  },
  ja: {
    add: 'カートへ',
    adding: '追加中...',
    added: '追加済み ✓',
    soldOut: '売り切れ',
    selectSize: 'サイズを選択',
    close: '閉じる',
    confirm: 'カートに追加',
    shipping: '配送',
    sale: 'セール',
  },
  en: {
    add: 'Add',
    adding: 'Adding...',
    added: 'Added ✓',
    soldOut: 'Sold Out',
    selectSize: 'Select Size',
    close: 'Close',
    confirm: 'Add to Cart',
    shipping: 'Shipping',
    sale: 'Sale',
  },
}

export default function QuickAddButton({ product, lang, soldOut }: Props) {
  const t = labels[lang]
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  const variants = product.variants.nodes
  const isSingleVariant = variants.length === 1 && variants[0].selectedOptions[0]?.name === 'Title'

  const minPrice = product.priceRange.minVariantPrice
  const compareAt = product.compareAtPriceRange?.maxVariantPrice
  const isOnSale = compareAt && Number(compareAt.amount) > Number(minPrice.amount)
  const title = stripTitlePrefix(product.title)

  if (soldOut) {
    return <span className="w-full text-center text-xs text-ink-muted py-2 block">{t.soldOut}</span>
  }

  function notifyCartUpdated() {
    window.dispatchEvent(new Event('cart:updated'))
  }

  function handleAddDirect(variantId: string) {
    startTransition(async () => {
      await addToCart(variantId, lang)
      setAdded(true)
      notifyCartUpdated()
      setTimeout(() => setAdded(false), 2000)
    })
  }

  function handleConfirm() {
    if (!selectedId) return
    startTransition(async () => {
      await addToCart(selectedId, lang)
      setAdded(true)
      setModalOpen(false)
      setSelectedId(null)
      notifyCartUpdated()
      setTimeout(() => setAdded(false), 2000)
    })
  }

  function openModal(e: React.MouseEvent) {
    e.preventDefault()
    if (isSingleVariant) {
      handleAddDirect(variants[0].id)
    } else {
      setModalOpen(true)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        disabled={isPending || added}
        aria-label={t.add}
        className="w-full flex items-center justify-center py-2 text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
      >
        {added ? (
          <span className="text-xs">{t.added}</span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        )}
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => { setModalOpen(false); setSelectedId(null) }}
        >
          <div className="absolute inset-0 bg-ink/30" />
          <div
            className="relative bg-white w-full sm:max-w-2xl flex flex-col sm:flex-row overflow-hidden max-h-[90dvh] sm:max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product image — hidden on mobile, shown on sm+ */}
            {product.featuredImage && (
              <div className="hidden sm:block relative w-56 shrink-0 aspect-[3/4]">
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText ?? title}
                  fill
                  sizes="224px"
                  className="object-cover"
                />
              </div>
            )}

            {/* Right panel */}
            <div className="flex flex-col p-6 overflow-y-auto flex-1 min-h-0">
              {/* Close button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { setModalOpen(false); setSelectedId(null) }}
                  aria-label={t.close}
                  className="text-ink-muted hover:text-ink transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Title + Price */}
              <div className="mb-5">
                <p className="text-sm font-medium leading-snug mb-2">{title}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-semibold ${isOnSale ? 'text-coral' : 'text-ink'}`}>
                    {formatPrice(minPrice.amount, minPrice.currencyCode, lang)}
                  </span>
                  {isOnSale && compareAt && (
                    <span className="text-sm text-ink-muted line-through">
                      {formatPrice(compareAt.amount, compareAt.currencyCode, lang)}
                    </span>
                  )}
                </div>
              </div>

              {/* Shipping notice — latest batch only */}
              {product.shippingNotice?.value && (() => {
                const lines = product.shippingNotice!.value.split('\n')
                const title = lines[0]
                const body = lines.slice(1)
                const firstBlank = body.findIndex(l => !l.trim())
                const latest = firstBlank === -1 ? body : body.slice(0, firstBlank)
                return (
                  <div className="mb-5 p-3 bg-surface">
                    <p className="text-[11px] font-semibold text-ink mb-2 tracking-wide uppercase">{title}</p>
                    <div className="flex flex-col gap-1">
                      {latest.filter(l => l.trim()).map((line, i) => (
                        <p key={i} className="text-xs text-ink-muted leading-relaxed">{line}</p>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Size selector */}
              <div className="mb-5">
                <p className="text-[11px] font-semibold text-ink mb-2.5 tracking-wide uppercase">
                  {t.selectSize}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedId(v.id)}
                      disabled={!v.availableForSale}
                      className={[
                        'px-3 py-1.5 text-xs border transition-colors',
                        !v.availableForSale
                          ? 'border-border text-ink-muted/40 line-through cursor-not-allowed'
                          : selectedId === v.id
                          ? 'border-ink bg-ink text-white'
                          : 'border-border text-ink hover:border-ink',
                      ].join(' ')}
                    >
                      {v.selectedOptions[0]?.value ?? v.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm button */}
              <button
                onClick={handleConfirm}
                disabled={!selectedId || isPending}
                className="w-full py-3 text-sm bg-ink text-white disabled:opacity-30 transition-opacity hover:opacity-80 mt-auto"
              >
                {isPending ? t.adding : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
