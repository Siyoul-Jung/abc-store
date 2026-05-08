import { notFound } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import { getProducts } from '@/lib/shopify/storefront'
import ProductCard from '@/components/product/ProductCard'
import type { Locale } from '@/lib/shopify/types'

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const products = await getProducts(lang as Locale, 40)

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">All Products</h1>

      {products.length === 0 ? (
        <p className="text-ink-muted text-sm">상품이 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} lang={lang as Locale} />
          ))}
        </div>
      )}
    </section>
  )
}
