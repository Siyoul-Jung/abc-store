import Link from 'next/link'
import Image from 'next/image'
import { gidToNumericId, formatPrice } from '@/lib/utils/format'
import type { Product, Locale } from '@/lib/shopify/types'

type Props = {
  products: Product[]
  lang: Locale
  viewAllLabel: string
}

export default function NewArrivalsSection({ products, lang, viewAllLabel }: Props) {
  const featured = products.slice(0, 3)
  if (featured.length === 0) return null

  return (
    <section className="bg-surface py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-10">

        <h2 className="text-3xl sm:text-4xl font-black tracking-widest uppercase text-ink">
          New Arrivals
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-10 w-full">
          {featured.map((product) => (
            <Link
              key={product.id}
              href={`/${lang}/products/${gidToNumericId(product.id)}`}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="relative w-full aspect-[3/4] overflow-hidden">
                {product.featuredImage ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText ?? product.title}
                    fill
                    sizes="(max-width: 640px) 45vw, 30vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white/20" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink leading-snug line-clamp-1">
                  {product.title}
                </p>
                <p className="text-sm text-ink mt-0.5">
                  {formatPrice(
                    product.priceRange.minVariantPrice.amount,
                    product.priceRange.minVariantPrice.currencyCode,
                    lang,
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href={`/${lang}/products`}
          className="border border-ink text-ink text-sm font-semibold px-8 py-3 hover:bg-ink hover:text-white active:scale-95 transition-all"
        >
          {viewAllLabel} →
        </Link>

      </div>
    </section>
  )
}
