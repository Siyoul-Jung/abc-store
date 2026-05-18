import Link from 'next/link'
import Image from 'next/image'
import { gidToNumericId, formatPrice, stripTitlePrefix } from '@/lib/utils/format'
import QuickAddButton from '@/components/product/QuickAddButton'
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
    <section className="py-8 sm:py-10 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {title && (
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-sm font-bold tracking-widest uppercase">{title}</h2>
            {viewAllLabel && (
              <Link
                href={`/${lang}/collections/new`}
                className="text-xs text-ink-muted hover:text-ink transition-colors"
              >
                {viewAllLabel} →
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-8">
          {products.map((product) => {
            const id        = gidToNumericId(product.id)
            const minPrice  = product.priceRange.minVariantPrice
            const compareAt = product.compareAtPriceRange?.maxVariantPrice
            const isOnSale  = compareAt && Number(compareAt.amount) > Number(minPrice.amount)
            const soldOut   = !product.variants.nodes.some((v) => v.availableForSale)
            return (
              <div key={product.id} className="flex flex-col">
                <Link href={`/${lang}/products/${id}`} className="group flex flex-col">
                  <div className="relative aspect-[3/4] w-full overflow-hidden mb-3">
                    {product.featuredImage ? (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText ?? product.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-surface" />
                    )}
                    {product.tags.includes('adult') && (
                      <span className="absolute top-2 left-2 bg-white/90 text-ink text-[10px] font-semibold tracking-widest px-2 py-0.5 uppercase">
                        ADULT
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-medium text-ink leading-snug line-clamp-2 text-center break-keep">
                    {stripTitlePrefix(product.title)}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`text-[13px] ${isOnSale ? 'text-coral font-medium' : 'text-ink-muted'}`}>
                      {formatPrice(minPrice.amount, minPrice.currencyCode, lang)}
                    </span>
                    {isOnSale && compareAt && (
                      <span className="text-[12px] text-ink-muted line-through">
                        {formatPrice(compareAt.amount, compareAt.currencyCode, lang)}
                      </span>
                    )}
                  </div>
                </Link>
                <QuickAddButton
                  product={product}
                  lang={lang}
                  soldOut={soldOut}
                />
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
