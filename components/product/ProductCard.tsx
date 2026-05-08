import Image from 'next/image'
import Link from 'next/link'
import { formatPrice, gidToNumericId } from '@/lib/utils/format'
import type { Product } from '@/lib/shopify/types'
import type { Locale } from '@/lib/shopify/types'

type Props = {
  product: Product
  lang: Locale
}

export default function ProductCard({ product, lang }: Props) {
  const price = product.priceRange.minVariantPrice
  const image = product.featuredImage

  return (
    <Link href={`/${lang}/products/${gidToNumericId(product.id)}`} className="group block">
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
        <p className="text-sm font-medium leading-snug line-clamp-2">{product.title}</p>
        <p className="text-sm text-ink-muted">
          {formatPrice(price.amount, price.currencyCode, lang)}
        </p>
      </div>
    </Link>
  )
}
