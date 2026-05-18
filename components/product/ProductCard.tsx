import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, gidToNumericId, stripTitlePrefix } from '@/lib/utils/format'
import QuickAddButton from './QuickAddButton'
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
        {image ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-sand">
            <span className="text-xs text-ink-muted">No image</span>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <p className="text-sm font-medium leading-snug line-clamp-2">{stripTitlePrefix(product.title)}</p>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isOnSale ? 'text-coral font-medium' : 'text-ink-muted'}`}>
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
    <QuickAddButton
      product={product}
      lang={lang}
      soldOut={soldOut}
    />
    </div>
  )
}
