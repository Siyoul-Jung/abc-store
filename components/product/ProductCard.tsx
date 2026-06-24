import Link from 'next/link'
import { formatPrice, gidToNumericId, stripTitlePrefix } from '@/lib/utils/format'
import QuickAddButton from './QuickAddButton'
import SwipeableProductImages from './SwipeableProductImages'
import type { Product } from '@/lib/shopify/types'
import type { Locale } from '@/lib/shopify/types'

type Props = {
  product: Product
  lang: Locale
}

export default function ProductCard({ product, lang }: Props) {
  const minPrice = product.priceRange.minVariantPrice
  const compareAt = product.compareAtPriceRange?.maxVariantPrice
  const isOnSale = compareAt && Number(compareAt.amount) > Number(minPrice.amount)
  const image = product.featuredImage
  const id = gidToNumericId(product.id)
  const soldOut = !product.variants.nodes.some((v) => v.availableForSale)

  return (
    <div className="flex flex-col">
    <Link href={`/${lang}/products/${id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-cream">
        <SwipeableProductImages
          images={product.images.nodes}
          title={product.title}
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
        {!soldOut && (
          <div className="absolute bottom-2 right-2 z-10">
            <QuickAddButton product={product} lang={lang} soldOut={soldOut} />
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-col gap-0.5">
        <p className="text-[13px] font-medium leading-snug line-clamp-2 text-center break-keep">{stripTitlePrefix(product.title)}</p>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-[13px] ${isOnSale ? 'text-coral font-medium' : 'text-ink-muted'}`}>
            {formatPrice(minPrice.amount, minPrice.currencyCode, lang)}
          </span>
          {isOnSale && compareAt && (
            <span className="text-xs text-ink-muted line-through">
              {formatPrice(compareAt.amount, compareAt.currencyCode, lang)}
            </span>
          )}
        </div>
      </div>
    </Link>
    </div>
  )
}
