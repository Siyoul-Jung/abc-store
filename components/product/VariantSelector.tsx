'use client'

import { useState, useTransition } from 'react'
import type { ProductVariant, Locale, Money } from '@/lib/shopify/types'
import { addToCart } from '@/lib/actions/cart'
import SizeGuideModal from '@/components/product/SizeGuideModal'
import PolicyModal from '@/components/product/PolicyModal'
import { formatPrice } from '@/lib/utils/format'

type Props = {
  variants: ProductVariant[]
  locale: Locale
  addToCartLabel: string
  soldOutLabel: string
  sizeGuideLabel: string
  freeShippingNotice: string
  descriptionHtml?: string
  careInstructions?: string
  shippingNotice?: string
  initialPrice: Money
  initialCompareAtPrice?: Money | null
}

function ShippingTimeline({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)

  const lines = text.split('\n')
  const title = lines[0]
  const body = lines.slice(1)

  const firstBlank = body.findIndex(l => !l.trim())
  const latest = firstBlank === -1 ? body : body.slice(0, firstBlank)
  const older = firstBlank === -1 ? [] : body.slice(firstBlank)
  const hasOlder = older.some(l => l.trim())
  const visibleItems = expanded ? body : latest

  function renderLines(items: string[]) {
    const nonEmptyCount = items.filter(l => l.trim()).length
    let dotIndex = -1
    return items.map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-1" />
      dotIndex++
      const isLast = dotIndex === nonEmptyCount - 1
      return (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center pt-[3px]">
            <div className="w-1.5 h-1.5 rounded-full bg-ink-muted shrink-0" />
            {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[14px]" />}
          </div>
          <p className="text-xs text-ink-muted pb-2 leading-relaxed">{line}</p>
        </div>
      )
    })
  }

  return (
    <div className="border border-border px-4 py-3">
      <p className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink">{title}</p>
      <div className="flex flex-col">
        {renderLines(visibleItems)}
      </div>
      {hasOlder && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-1 text-xs text-ink-muted underline underline-offset-2 hover:text-ink transition-colors"
        >
          {expanded ? '접기 ↑' : '더보기 ↓'}
        </button>
      )}
    </div>
  )
}

export default function VariantSelector({ variants, locale, addToCartLabel, soldOutLabel, sizeGuideLabel, freeShippingNotice, descriptionHtml, careInstructions, shippingNotice, initialPrice, initialCompareAtPrice }: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    variants.find((v) => v.availableForSale)?.id ?? variants[0]?.id ?? '',
  )
  const [added, setAdded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [openSection, setOpenSection] = useState<'description' | 'care' | null>(null)

  const selected = variants.find((v) => v.id === selectedId)
  const hasOptions = variants.some((v) => v.selectedOptions.some((o) => o.name !== 'Title'))

  function handleAddToCart() {
    if (!selected?.availableForSale || isPending) return
    startTransition(async () => {
      await addToCart(selected.id, locale)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    })
  }

  const currentPrice = selected?.price ?? initialPrice
  const currentCompareAt = selected?.compareAtPrice ?? initialCompareAtPrice ?? null
  const isOnSale = currentCompareAt && Number(currentCompareAt.amount) > Number(currentPrice.amount)

  return (
    <>
      {sizeGuideOpen && <SizeGuideModal locale={locale} onClose={() => setSizeGuideOpen(false)} />}
      {policyOpen && <PolicyModal locale={locale} onClose={() => setPolicyOpen(false)} />}
      <div className="flex flex-col gap-5">

        <div className="flex items-baseline gap-3">
          <span className="text-lg font-semibold">
            {formatPrice(currentPrice.amount, currentPrice.currencyCode, locale)}
          </span>
          {isOnSale && (
            <span className="text-sm text-ink-muted line-through">
              {formatPrice(currentCompareAt.amount, currentCompareAt.currencyCode, locale)}
            </span>
          )}
        </div>

        {hasOptions && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tracking-widest uppercase">
                {selected?.selectedOptions[0]?.name}
              </span>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink transition-colors"
              >
                {sizeGuideLabel}
              </button>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))' }}>
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  disabled={!v.availableForSale}
                  className={`w-full py-2.5 text-sm border transition-colors ${
                    v.id === selectedId
                      ? 'border-ink bg-ink text-white font-medium'
                      : v.availableForSale
                        ? 'border-border hover:border-ink'
                        : 'border-border text-ink-muted line-through cursor-not-allowed opacity-40'
                  }`}
                >
                  {v.selectedOptions[0]?.value ?? v.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {shippingNotice && <ShippingTimeline text={shippingNotice} />}

        <button
          onClick={handleAddToCart}
          disabled={!selected?.availableForSale || isPending}
          className={`w-full py-4 text-sm font-medium tracking-widest uppercase transition-colors ${
            !selected?.availableForSale
              ? 'bg-stone text-ink-muted cursor-not-allowed'
              : added
                ? 'bg-ink text-white'
                : 'bg-ink text-white hover:opacity-80'
          }`}
        >
          {isPending ? '···' : added ? '✓' : selected?.availableForSale ? addToCartLabel : soldOutLabel}
        </button>

        {locale === 'ko' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-ink-muted">✓ 80,000원 이상 무료배송</span>
                <span className="text-xs text-ink-muted">✓ 수령 후 7일 이내 교환·반품</span>
              </div>
              <button onClick={() => setPolicyOpen(true)} className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink transition-colors shrink-0">안내 →</button>
            </div>
          </div>
        ) : freeShippingNotice ? (
          <p className="text-xs text-center text-ink-muted">{freeShippingNotice}</p>
        ) : null}

        <div className="border-t border-border">
          {descriptionHtml && (
            <div className="border-b border-border">
              <button
                onClick={() => setOpenSection(openSection === 'description' ? null : 'description')}
                className="w-full flex items-center justify-between py-4 text-sm font-medium text-left"
              >
                {locale === 'ko' ? '상품 설명' : '商品説明'}
                <span className="text-ink-muted text-lg leading-none">{openSection === 'description' ? '−' : '+'}</span>
              </button>
              {openSection === 'description' && (
                <div className="pb-5 text-sm text-ink-muted whitespace-pre-line leading-relaxed">
                  {descriptionHtml}
                </div>
              )}
            </div>
          )}
          <div className="border-b border-border">
            <button
              onClick={() => setOpenSection(openSection === 'care' ? null : 'care')}
              className="w-full flex items-center justify-between py-4 text-sm font-medium text-left"
            >
              {locale === 'ko' ? '소재 & 케어' : '素材・ケア'}
              <span className="text-ink-muted text-lg leading-none">{openSection === 'care' ? '−' : '+'}</span>
            </button>
            {openSection === 'care' && (
              <div className="pb-5 text-sm text-ink-muted whitespace-pre-line leading-relaxed">
                {careInstructions}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

