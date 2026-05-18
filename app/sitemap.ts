import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/shopify/storefront'
import { gidToNumericId } from '@/lib/utils/format'

const BASE = 'https://applebuttercollege.com'
const LOCALES = ['ko', 'ja'] as const
const COLLECTIONS = ['new', 'kids', 'adult', 'sale']
const STATIC_PAGES = ['', '/about', '/collections/new', '/collections/kids', '/collections/adult', '/collections/sale', '/cart', '/returns']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts('ko', 200)

  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((lang) =>
    STATIC_PAGES.map((path) => ({
      url: `${BASE}/${lang}${path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    }))
  )

  const productEntries: MetadataRoute.Sitemap = LOCALES.flatMap((lang) =>
    products.map((product) => ({
      url: `${BASE}/${lang}/products/${gidToNumericId(product.id)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  )

  return [...staticEntries, ...productEntries]
}
