import { shopifyClient, getShopifyContext } from './client'
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_BY_ID_QUERY,
  GET_COLLECTIONS_QUERY,
} from './queries/products'
import type { Locale, Product, Collection } from './types'

export async function getProducts(locale: Locale, first = 20): Promise<Product[]> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_PRODUCTS_QUERY, {
    variables: { first, ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.products.nodes
}

export function numericIdToGid(id: string): string {
  return `gid://shopify/Product/${id}`
}

export async function getProductById(
  id: string,
  locale: Locale,
): Promise<Product | null> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_PRODUCT_BY_ID_QUERY, {
    variables: { id: numericIdToGid(id), ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.product ?? null
}

export async function getCollections(locale: Locale, first = 10): Promise<Collection[]> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_COLLECTIONS_QUERY, {
    variables: { first, ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.collections.nodes
}
