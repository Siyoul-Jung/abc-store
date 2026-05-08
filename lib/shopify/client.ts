import { createStorefrontApiClient } from '@shopify/storefront-api-client'
import type { Locale, ShopifyContext } from './types'

export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN!,
  apiVersion: process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2025-01',
  publicAccessToken: process.env.SHOPIFY_STOREFRONT_API_TOKEN!,
})

const localeContextMap: Record<Locale, ShopifyContext> = {
  ko: { country: 'KR', language: 'KO' },
  ja: { country: 'JP', language: 'JA' },
}

export function getShopifyContext(locale: Locale): ShopifyContext {
  return localeContextMap[locale]
}
