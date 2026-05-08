import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { hasLocale, getDictionary } from '../../../dictionaries'
import { getProductById } from '@/lib/shopify/storefront'
import { formatPrice } from '@/lib/utils/format'
import ProductImageGallery from '@/components/product/ProductImageGallery'
import VariantSelector from '@/components/product/VariantSelector'
import type { Locale } from '@/lib/shopify/types'

type Props = { params: Promise<{ lang: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params
  if (!hasLocale(lang)) return {}
  const product = await getProductById(id, lang as Locale)
  if (!product) return {}
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      images: product.featuredImage ? [product.featuredImage.url] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const [product, dict] = await Promise.all([
    getProductById(id, lang as Locale),
    getDictionary(lang as Locale),
  ])

  if (!product) notFound()

  const price = product.priceRange.minVariantPrice
  const maxPrice = product.priceRange.maxVariantPrice
  const hasRange = price.amount !== maxPrice.amount

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">

        <ProductImageGallery images={product.images.nodes} title={product.title} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold leading-snug">{product.title}</h1>
            <p className="text-base text-ink-muted">
              {hasRange
                ? `${formatPrice(price.amount, price.currencyCode, lang as Locale)} ~ ${formatPrice(maxPrice.amount, maxPrice.currencyCode, lang as Locale)}`
                : formatPrice(price.amount, price.currencyCode, lang as Locale)}
            </p>
          </div>

          <VariantSelector
            variants={product.variants.nodes}
            locale={lang as Locale}
            addToCartLabel={dict.product.addToCart}
            soldOutLabel={dict.product.soldOut}
          />

          {product.descriptionHtml && (
            <div
              className="prose prose-sm text-ink-muted max-w-none pt-6 border-t border-border"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          )}
        </div>
      </div>
    </section>
  )
}
