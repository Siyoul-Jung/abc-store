import Link from 'next/link'
import { gidToNumericId } from '@/lib/utils/format'
import ProductCard from '@/components/product/ProductCard'
import type { Product } from '@/lib/shopify/types'
import type { Locale } from '@/lib/shopify/types'

type Props = {
  products: Product[]
  lang: Locale
  title: string
  viewAllLabel: string
}

export default function ProductCarousel({ products, lang, title, viewAllLabel }: Props) {
  if (products.length === 0) return null

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-baseline justify-between mb-6">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <Link
          href={`/${lang}/products`}
          className="text-xs text-ink hover:opacity-60 transition-opacity"
        >
          {viewAllLabel} →
        </Link>
      </div>

      <div className="overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex gap-3 sm:gap-4 px-4 sm:px-6 max-w-7xl mx-auto snap-x snap-mandatory">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none w-[48vw] max-w-[200px] sm:w-[200px] snap-start"
            >
              <ProductCard product={product} lang={lang} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
