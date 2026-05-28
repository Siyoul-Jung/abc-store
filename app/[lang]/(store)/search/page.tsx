import { notFound } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import { shopifyClient, getShopifyContext } from '@/lib/shopify/client'
import { SEARCH_QUERY } from '@/lib/shopify/queries/search'
import ProductGrid from '@/components/home/ProductGrid'
import type { Locale, Product } from '@/lib/shopify/types'

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ q?: string }>
}

const t: Record<Locale, { placeholder: string; results: string; noResults: string; noQuery: string }> = {
  ko: { placeholder: '검색어를 입력해 주세요', results: '개 결과', noResults: '검색 결과가 없습니다.', noQuery: '검색어를 입력해 주세요.' },
  ja: { placeholder: 'キーワードを入力してください', results: '件の結果', noResults: '検索結果がありません。', noQuery: 'キーワードを入力してください。' },
  en: { placeholder: 'Enter a search term', results: 'results', noResults: 'No results found.', noQuery: 'Enter a search term to search.' },
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const labels = t[locale]

  let products: Product[] = []
  let totalCount = 0

  if (query) {
    const ctx = getShopifyContext(locale)
    const { data } = await shopifyClient.request(SEARCH_QUERY, {
      variables: { query, first: 24, ...ctx },
    })
    products = (data?.search?.nodes ?? []) as Product[]
    totalCount = data?.search?.totalCount ?? 0
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-10">
        {query ? (
          <>
            <h1 className="text-lg font-semibold mb-1">&ldquo;{query}&rdquo;</h1>
            <p className="text-sm text-ink-muted">{totalCount.toLocaleString()}{labels.results}</p>
          </>
        ) : (
          <p className="text-sm text-ink-muted">{labels.noQuery}</p>
        )}
      </div>

      {query && products.length === 0 && (
        <p className="text-sm text-ink-muted">{labels.noResults}</p>
      )}

      {products.length > 0 && (
        <ProductGrid products={products} lang={locale} />
      )}
    </div>
  )
}
