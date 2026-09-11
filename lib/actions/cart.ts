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

export async function getCartCount(): Promise<number> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value
  if (!cartId) return 0

  const ctx = getShopifyContext('ko')
  // 헤더가 전 페이지에서 호출 — Storefront 오류가 throw돼도 레이아웃 전체를 500내지 않도록 방어.
  try {
    const { data, errors } = await shopifyClient.request(GET_CART_QUERY, {
      variables: { cartId, ...ctx },
    })
    if (errors || !data?.cart) return 0
    return data.cart.totalQuantity ?? 0
  } catch {
    return 0
  }
}

export async function getCart(locale: Locale): Promise<Cart | null> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value
  if (!cartId) return null

  const ctx = getShopifyContext(locale)
  try {
    const { data, errors } = await shopifyClient.request(GET_CART_QUERY, {
      variables: { cartId, ...ctx },
    })
    if (errors) return null
    return data.cart ?? null
  } catch {
    return null
  }
}

type UserError = { field?: string[] | null; message: string }

export async function addToCart(variantId: string, locale: Locale, quantity = 1): Promise<Cart> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value
  const ctx = getShopifyContext(locale)

  // 기존 카트가 있으면 라인 추가를 먼저 시도. cartId가 만료/무효면 cart가 null로 오는데,
  // 그 경우 아래에서 새 카트를 생성해 복구한다(쿠키 재설정).
  if (cartId) {
    const { data, errors } = await shopifyClient.request(CART_LINES_ADD_MUTATION, {
      variables: { cartId, lines: [{ merchandiseId: variantId, quantity }], ...ctx },
    })
    if (!errors) {
      const userErrors: UserError[] = data?.cartLinesAdd?.userErrors ?? []
      if (userErrors.length > 0) throw new Error(userErrors[0].message)
      const cart: Cart | null = data?.cartLinesAdd?.cart ?? null
      if (cart) return cart
    }
    // 여기 도달 = errors 이거나 cart null(무효 cartId) → 새 카트 생성으로 복구
  }

  const { data, errors } = await shopifyClient.request(CART_CREATE_MUTATION, {
    variables: { lines: [{ merchandiseId: variantId, quantity }], ...ctx },
  })
  const userErrors: UserError[] = data?.cartCreate?.userErrors ?? []
  if (userErrors.length > 0) throw new Error(userErrors[0].message)
  const cart: Cart | null = errors ? null : data?.cartCreate?.cart ?? null
  if (!cart) throw new Error('장바구니에 담지 못했습니다. 잠시 후 다시 시도해 주세요.')

  cookieStore.set(CART_COOKIE, cart.id, {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  })
  return cart
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
  const { data, errors } = await shopifyClient.request(CART_LINES_UPDATE_MUTATION, {
    variables: { cartId, lines: [{ id: lineId, quantity }], ...ctx },
  })
  if (errors) return null
  const cart: Cart | null = data?.cartLinesUpdate?.cart ?? null
  // 카트가 null이면 cartId 만료/무효 → 스테일 쿠키 정리(다음 조회가 깨끗하게 null 반환)
  if (!cart) cookieStore.delete(CART_COOKIE)
  return cart
}

export async function buyNow(variantId: string, locale: Locale): Promise<string> {
  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(CART_CREATE_MUTATION, {
    variables: { lines: [{ merchandiseId: variantId, quantity: 1 }], ...ctx },
  })
  const checkoutUrl: string | undefined = errors ? undefined : data?.cartCreate?.cart?.checkoutUrl
  if (!checkoutUrl) throw new Error('결제 페이지로 이동하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  return checkoutUrl
}

export async function removeCartLine(lineId: string, locale: Locale): Promise<Cart | null> {
  const cookieStore = await cookies()
  const cartId = cookieStore.get(CART_COOKIE)?.value
  if (!cartId) return null

  const ctx = getShopifyContext(locale)
  const { data, errors } = await shopifyClient.request(CART_LINES_REMOVE_MUTATION, {
    variables: { cartId, lineIds: [lineId], ...ctx },
  })
  if (errors) return null
  const cart: Cart | null = data?.cartLinesRemove?.cart ?? null
  if (!cart) cookieStore.delete(CART_COOKIE)
  return cart
}
