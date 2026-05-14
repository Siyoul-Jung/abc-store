'use server'

import { cookies } from 'next/headers'
import { shopifyClient, getShopifyContext } from '@/lib/shopify/client'
import {
  GET_CART_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from '@/lib/shopify/queries/cart'
import type { Cart, Locale } from '@/lib/shopify/types'

const CART_COOKIE = 'cart_id'

export async function getCart(locale: Locale): Promise<Cart | null> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value
  if (!cartId) return null

  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(GET_CART_QUERY, {
    variables: { cartId, ...ctx },
  })
  if (errors) return null
  return data.cart ?? null
}

export async function addToCart(variantId: string, locale: Locale, quantity = 1): Promise<Cart> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value
  const ctx = getShopifyContext(locale)

  if (!cartId) {
    const { data } = await shopifyClient.request(CART_CREATE_MUTATION, {
      variables: { lines: [{ merchandiseId: variantId, quantity }], ...ctx },
    })
    const cart: Cart = data.cartCreate.cart
    cookieStore.set(CART_COOKIE, cart.id, {
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })
    return cart
  }

  const { data } = await shopifyClient.request(CART_LINES_ADD_MUTATION, {
    variables: { cartId, lines: [{ merchandiseId: variantId, quantity }], ...ctx },
  })
  return data.cartLinesAdd.cart
}

export async function updateCartLine(
  lineId: string,
  quantity: number,
  locale: Locale,
): Promise<Cart | null> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value
  if (!cartId) return null

  const ctx = getShopifyContext(locale)
  const { data } = await shopifyClient.request(CART_LINES_UPDATE_MUTATION, {
    variables: { cartId, lines: [{ id: lineId, quantity }], ...ctx },
  })
  return data.cartLinesUpdate.cart
}

export async function buyNow(variantId: string, locale: Locale): Promise<string> {
  const ctx = getShopifyContext(locale)
  const { data } = await shopifyClient.request(CART_CREATE_MUTATION, {
    variables: { lines: [{ merchandiseId: variantId, quantity: 1 }], ...ctx },
  })
  return data.cartCreate.cart.checkoutUrl as string
}

export async function removeCartLine(lineId: string, locale: Locale): Promise<Cart | null> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value
  if (!cartId) return null

  const ctx = getShopifyContext(locale)
  const { data } = await shopifyClient.request(CART_LINES_REMOVE_MUTATION, {
    variables: { cartId, lineIds: [lineId], ...ctx },
  })
  return data.cartLinesRemove.cart
}
