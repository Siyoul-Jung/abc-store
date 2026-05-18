import { shopifyClient, getShopifyContext } from './client'
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCTS_SORTED_QUERY,
  GET_PRODUCT_BY_ID_QUERY,
  GET_COLLECTIONS_QUERY,
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_BEST_SELLING_QUERY,
  GET_PRODUCTS_BY_TAG_QUERY,
  GET_PRODUCTS_BY_TAG_SORTED_QUERY,
} from './queries/products'
import { adminGql } from './admin'
import type { Locale, Product, Collection } from './types'

export async function getProductMetafields(
  gid: string,
): Promise<{ careInstructions: string | null; shippingNotice: string | null }> {
  const { data } = await adminGql(
    `query($id: ID!) {
      product(id: $id) {
        careInstructions: metafield(namespace: "custom", key: "care_instructions") { value }
        shippingNotice: metafield(namespace: "custom", key: "shipping_notice") { value }
      }
    }`,
    { id: gid },
  )
  return {
    careInstructions: data?.product?.careInstructions?.value ?? null,
    shippingNotice: data?.product?.shippingNotice?.value ?? null,
  }
}

export async function getProducts(locale: Locale, first = 20): Promise<Product[]> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_PRODUCTS_QUERY, {
    variables: { first, ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.products.nodes
}

export async function getBestSellingProducts(locale: Locale, first = 8): Promise<Product[]> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_BEST_SELLING_QUERY, {
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

export async function getCollectionByHandle(
  handle: string,
  locale: Locale,
  first = 40,
): Promise<Collection | null> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_COLLECTION_BY_HANDLE_QUERY, {
    variables: { handle, first, ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.collection ?? null
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'best_selling'

function toShopifySort(sort: SortOption): { sortKey: string; reverse: boolean } {
  switch (sort) {
    case 'price_asc':    return { sortKey: 'PRICE', reverse: false }
    case 'price_desc':   return { sortKey: 'PRICE', reverse: true }
    case 'best_selling': return { sortKey: 'BEST_SELLING', reverse: false }
    default:             return { sortKey: 'CREATED_AT', reverse: true }
  }
}

export async function getProductsSorted(locale: Locale, sort: SortOption, first = 40): Promise<Product[]> {
  const ctx = getShopifyContext(locale)
  const { sortKey, reverse } = toShopifySort(sort)
  const { data, errors } = await shopifyClient.request(GET_PRODUCTS_SORTED_QUERY, {
    variables: { first, sortKey, reverse, ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.products.nodes
}

export async function getProductsByTagSorted(tag: string, locale: Locale, sort: SortOption, first = 40): Promise<Product[]> {
  const ctx = getShopifyContext(locale)
  const { sortKey, reverse } = toShopifySort(sort)
  const { data, errors } = await shopifyClient.request(GET_PRODUCTS_BY_TAG_SORTED_QUERY, {
    variables: { first, tag: `tag:${tag}`, sortKey, reverse, ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.products.nodes
}

export async function getProductsByTag(tag: string, locale: Locale, first = 40): Promise<Product[]> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_PRODUCTS_BY_TAG_QUERY, {
    variables: { first, tag: `tag:${tag}`, ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.products.nodes
}

export async function getCollections(locale: Locale, first = 10): Promise<Collection[]> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_COLLECTIONS_QUERY, {
    variables: { first, ...ctx },
  })
  if (errors) throw new Error(errors.message)
  return data.collections.nodes
}
