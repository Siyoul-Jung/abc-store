import Link from 'next/link'
import { gidToNumericId, formatPrice, stripTitlePrefix } from '@/lib/utils/format'
import QuickAddButton from '@/components/product/QuickAddButton'
import SwipeableProductImages from '@/components/product/SwipeableProductImages'
import type { Product, Locale } from '@/lib/shopify/types'

type Props = {
  products: Product[]
  lang: Locale
  title?: string
  viewAllLabel?: string
}

export default function ProductGrid({ products, lang, title, viewAllLabel }: Props) {
  if (products.length === 0) return null

  return (
    <section className="py-6 sm:py-8 mt-4">
      <div className="max-w-7xl mx-auto px-0 sm:px-6">

        {title && (
          <div className="mb-6 px-4 sm:px-0">
            <h2 className="text-sm font-bold tracking-widest uppercase">{title}</h2>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-0.5 gap-y-6 sm:gap-x-4 sm:gap-y-8">
          {products.map((product) => {
            const id        = gidToNumericId(product.id)
            const minPrice  = product.priceRange.minVariantPrice
            const compareAt = product.compareAtPriceRange?.maxVariantPrice
            const isOnSale  = compareAt && Number(compareAt.amount) > Number(minPrice.amount)   // 정가>판매가 → 코랄·취소선 가격
            const soldOut   = !product.variants.nodes.some((v) => v.availableForSale)
            const isNew     = product.tags.includes('new')    // 컬렉션 핸들과 동일한 태그 기준
            const isSale    = product.tags.includes('sale')   // SALE 배지는 'sale' 태그로만 — 상시할인(정가)과 분리
            const soldOutLabel = lang === 'ja' ? '完売' : lang === 'en' ? 'SOLD OUT' : '품절'
            return (
              <div key={product.id}>
                <Link href={`/${lang}/products/${id}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] w-full overflow-hidden mb-3">
                    <SwipeableProductImages
                      images={product.images.nodes}
                      title={product.title}
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                    {/* 배지 스택: 품절이면 품절만, 아니면 SALE·NEW. ADULT는 카테고리 표식이라 별도. */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
                      {soldOut ? (
                        <span className="bg-ink/75 text-white text-[10px] font-semibold tracking-widest px-2 py-0.5 uppercase">
                          {soldOutLabel}
                        </span>
                      ) : (
                        <>
                          {isSale && (
                            <span className="bg-coral text-white text-[10px] font-semibold tracking-widest px-2 py-0.5 uppercase">
                              SALE
                            </span>
                          )}
                          {isNew && (
                            <span className="bg-ink text-white text-[10px] font-semibold tracking-widest px-2 py-0.5 uppercase">
                              NEW
                            </span>
                          )}
                        </>
                      )}
                      {product.tags.includes('adult') && (
                        <span className="bg-white/90 text-ink text-[10px] font-semibold tracking-widest px-2 py-0.5 uppercase">
                          ADULT
                        </span>
                      )}
                    </div>
                    {!soldOut && (
                      <div className="absolute bottom-2 right-2 z-10">
                        <QuickAddButton product={product} lang={lang} soldOut={soldOut} />
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] sm:text-[13px] font-medium text-ink leading-snug line-clamp-2 text-center break-keep">
                    {stripTitlePrefix(product.title)}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`text-[13px] ${isOnSale ? 'text-coral font-medium' : 'text-ink'}`}>
                      {formatPrice(minPrice.amount, minPrice.currencyCode, lang)}
                    </span>
                    {isOnSale && compareAt && (
                      <span className="text-[12px] text-ink-muted line-through">
                        {formatPrice(compareAt.amount, compareAt.currencyCode, lang)}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>

        {viewAllLabel && (
          <div className="flex justify-center mt-10 px-4 sm:px-0">
            <Link
              href={`/${lang}/collections/new`}
              className="text-xs px-6 py-2.5 border border-ink text-ink rounded-full hover:bg-ink hover:text-white transition-colors"
            >
              {viewAllLabel} →
            </Link>
          </div>
        )}

      </div>
    </section>
  )
}
