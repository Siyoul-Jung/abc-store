'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { ProductVariant, Locale, Money } from '@/lib/shopify/types'
import { addToCart } from '@/lib/actions/cart'
import SizeGuideModal from '@/components/product/SizeGuideModal'
import PolicyModal from '@/components/product/PolicyModal'
import RestockNotify from '@/components/product/RestockNotify'
import { formatPrice, gidToNumericId } from '@/lib/utils/format'
import { trackPixel } from '@/lib/analytics/pixel'

type Props = {
  variants: ProductVariant[]
  locale: Locale
  productId: string
  productTitle: string
  addToCartLabel: string
  soldOutLabel: string
  sizeGuideLabel: string
  freeShippingNotice: string
  descriptionHtml?: string
  careInstructions?: string
  shippingNotice?: string
  initialPrice: Money
  initialCompareAtPrice?: Money | null
  adult?: boolean
  buyNowLabel: string
  imageUrl?: string
}

function ShippingTimeline({ text, locale }: { text: string; locale: Locale }) {
  // 일정(오픈/배송 날짜)과 주의사항(- 으로 시작)을 분리
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const schedule = lines.filter(l => !l.startsWith('-') && /(오픈|배송)\s*[:：]/.test(l))
  const notices = lines.filter(l => l.startsWith('-')).map(l => l.replace(/^-+\s*/, ''))

  return (
    <div className="border border-border px-4 py-3">
      <p className="text-xs font-semibold tracking-widest uppercase mb-3 text-ink">
        {locale === 'ko' ? '오픈 & 배송 안내' : locale === 'ja' ? '発売・配送のご案内' : 'Release & shipping'}
      </p>

      {/* 일정: 오픈 · 배송 날짜 타임라인 */}
      <div className="flex flex-col">
        {schedule.map((line, i) => {
          const idx = line.search(/[:：]/)
          const label = idx >= 0 ? line.slice(0, idx).trim() : line
          const val = idx >= 0 ? line.slice(idx + 1).trim() : ''
          const isLast = i === schedule.length - 1
          return (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center pt-[5px]">
                <div className="w-1.5 h-1.5 rounded-full bg-ink shrink-0" />
                {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[16px]" />}
              </div>
              <p className="text-xs pb-2.5 leading-relaxed">
                <span className="font-semibold text-ink">{label}</span>
                {val && <span className="text-ink-muted ml-2">{val}</span>}
              </p>
            </div>
          )
        })}
      </div>

      {/* 주의사항: 점선 아래 작은 회색 목록 */}
      {notices.length > 0 && (
        <ul className="mt-1 pt-3 border-t border-dashed border-border flex flex-col gap-1.5">
          {notices.map((n, i) => (
            <li key={i} className="text-[11px] text-ink-muted leading-relaxed flex gap-1.5">
              <span className="shrink-0">·</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function VariantSelector({ variants, locale, productId, productTitle, addToCartLabel, soldOutLabel, sizeGuideLabel, freeShippingNotice, descriptionHtml, careInstructions, shippingNotice, initialPrice, initialCompareAtPrice, adult, buyNowLabel, imageUrl }: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    variants.find((v) => v.availableForSale)?.id ?? variants[0]?.id ?? '',
  )
  const [added, setAdded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [openSection, setOpenSection] = useState<'description' | 'care' | null>(null)
  // 하단 고정 구매바: 본문 구매 버튼이 화면 위로 스크롤돼 사라졌을 때만 노출(아래에 있을 땐 숨김)
  const buyRef = useRef<HTMLDivElement>(null)
  const [showSticky, setShowSticky] = useState(false)
  useEffect(() => {
    const el = buyRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const selected = variants.find((v) => v.id === selectedId)
  const hasOptions = variants.some((v) => v.selectedOptions.some((o) => o.name !== 'Title'))

  // goCheckout: '바로 구매' — 담은 뒤 체크아웃으로 이동(토스트·✓ 표시 생략)
  function handleAddToCart(goCheckout = false) {
    if (!selected?.availableForSale || isPending) return
    startTransition(async () => {
      await addToCart(selected.id, locale)
      trackPixel('AddToCart', {
        content_ids: [gidToNumericId(productId)],
        content_type: 'product',
        value: Number(selected.price.amount),
        currency: selected.price.currencyCode,
      })
      if (goCheckout) {
        router.push(`/${locale}/checkout`)
        return
      }
      window.dispatchEvent(new Event('cart:updated'))
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    })
  }

  const currentPrice = selected?.price ?? initialPrice
  const currentCompareAt = selected?.compareAtPrice ?? initialCompareAtPrice ?? null
  const isOnSale = currentCompareAt && Number(currentCompareAt.amount) > Number(currentPrice.amount)

  return (
    <>
      {sizeGuideOpen && <SizeGuideModal locale={locale} adult={adult} onClose={() => setSizeGuideOpen(false)} />}
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
                      ? 'border-forest bg-forest text-white font-medium'
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

        {shippingNotice && <ShippingTimeline text={shippingNotice} locale={locale} />}

        <div ref={buyRef} className="flex flex-col gap-2.5">
          <button
            onClick={() => handleAddToCart()}
            disabled={!selected?.availableForSale || isPending}
            className={`w-full py-4 font-headline text-lg tracking-[0.06em] uppercase transition-colors ${
              !selected?.availableForSale
                ? 'bg-line text-ink-muted cursor-not-allowed'
                : 'bg-forest text-white hover:opacity-90'
            }`}
          >
            {isPending ? '···' : added ? '✓' : selected?.availableForSale ? addToCartLabel : soldOutLabel}
          </button>
          {selected?.availableForSale && (
            <button
              onClick={() => handleAddToCart(true)}
              disabled={isPending}
              className="w-full py-3.5 border-2 border-forest text-forest font-headline text-lg tracking-[0.06em] uppercase hover:bg-forest hover:text-white transition-colors disabled:opacity-40"
            >
              {buyNowLabel}
            </button>
          )}
        </div>

        {/* 선택한 사이즈가 품절이면 재입고 알림 신청 — 이탈 대신 수요를 수집 */}
        {selected && !selected.availableForSale && (
          <RestockNotify
            productId={productId}
            productTitle={productTitle}
            variantId={selected.id}
            variantTitle={selected.selectedOptions[0]?.value ?? selected.title}
            locale={locale}
          />
        )}

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
                {locale === 'ko' ? '상품 설명' : locale === 'ja' ? '商品説明' : 'Product details'}
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
              {locale === 'ko' ? '소재 & 케어' : locale === 'ja' ? '素材・ケア' : 'Materials & care'}
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

      {selected?.availableForSale && (
        <div
          aria-hidden={!showSticky}
          className={`fixed inset-x-0 bottom-0 z-20 bg-cream border-t border-border pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
            showSticky ? 'translate-y-0' : 'translate-y-full pointer-events-none'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            {imageUrl && (
              <div className="relative hidden md:block w-12 h-14 shrink-0 overflow-hidden bg-surface">
                <Image src={imageUrl} alt="" fill sizes="48px" className="object-cover" />
              </div>
            )}
            <div className="hidden md:flex flex-col min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{productTitle}</p>
              {hasOptions && <p className="text-xs text-ink-muted">{selected.selectedOptions[0]?.value}</p>}
            </div>
            <span className="ml-auto text-sm sm:text-base font-semibold text-ink whitespace-nowrap">
              {formatPrice(currentPrice.amount, currentPrice.currencyCode, locale)}
            </span>
            <button
              onClick={() => handleAddToCart()}
              disabled={isPending}
              tabIndex={showSticky ? 0 : -1}
              className="flex-1 md:flex-none md:px-10 py-3 bg-forest text-white font-headline text-base tracking-[0.06em] uppercase hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {isPending ? '···' : added ? '✓' : addToCartLabel}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

