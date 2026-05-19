import { notFound } from 'next/navigation'
import { hasLocale } from '../../../dictionaries'
import { getProductsSorted, getProductsByTagSorted } from '@/lib/shopify/storefront'
import type { SortOption } from '@/lib/shopify/storefront'
import ProductCard from '@/components/product/ProductCard'
import SortSelector from '@/components/collections/SortSelector'
import type { Locale, Product } from '@/lib/shopify/types'

const COLLECTION_META: Record<string, { ko: string; ja: string; en: string }> = {
  kids:  { ko: 'KIDS',  ja: 'KIDS',  en: 'KIDS' },
  adult: { ko: 'ADULT', ja: 'ADULT', en: 'ADULT' },
  new:   { ko: 'NEW',   ja: 'NEW',   en: 'NEW' },
  sale:  { ko: 'SALE',  ja: 'SALE',  en: 'SALE' },
}

async function getCollectionProducts(handle: string, locale: Locale, sort: SortOption): Promise<Product[]> {
  if (handle === 'new') return getProductsSorted(locale, sort, 40)
  return getProductsByTagSorted(handle, locale, sort, 40)
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; handle: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { lang, handle } = await params
  const { sort: sortParam } = await searchParams
  if (!hasLocale(lang)) notFound()

  const meta = COLLECTION_META[handle]
  if (!meta) notFound()

  const locale = lang as Locale
  const sort = (sortParam as SortOption) || 'newest'
  const products = await getCollectionProducts(handle, locale, sort)
  const title = meta[locale] ?? meta.ko

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-sm font-bold tracking-widest uppercase">{title}</h1>
        <SortSelector lang={lang} current={sort} />
      </div>

      {products.length === 0 ? (
        <p className="text-ink-muted text-sm">
          {locale === 'ko' ? '상품이 없어요.' : '商品がありません。'}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} lang={locale} />
          ))}
        </div>
      )}
    </section>
  )
}
