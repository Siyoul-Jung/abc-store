import { NextResponse, type NextRequest } from 'next/server'
import { getCart } from '@/lib/actions/cart'
import { createShopifyOrder } from '@/lib/actions/order'
import { sendCAPIEvent } from '@/lib/meta-capi'
import type { Locale } from '@/lib/shopify/types'

const LOCALES: Locale[] = ['ko', 'ja', 'en']

// 토스 결제 성공 후 진입점 (successUrl).
// 결제확인 + 주문생성 + 쿠키정리 같은 "한 번만 일어나야 하는" 부수효과를 여기서 처리하고,
// 순수 표시 페이지(/checkout/complete)로 redirect한다. → 새로고침/재렌더 안전.

type TossVirtualAccount = {
  bankName: string
  accountNumber: string
  dueDate: string
}

async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<
  | { ok: false }
  | { ok: true; method: string; virtualAccount?: TossVirtualAccount }
> {
  const secretKey = process.env.TOSS_SECRET_KEY!
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')

  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { Authorization: `Basic ${encoded}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
    cache: 'no-store',
  })

  if (!res.ok) return { ok: false }
  const data = await res.json()
  return {
    ok: true,
    method: data.method ?? '',
    virtualAccount: data.virtualAccount
      ? {
          bankName: data.virtualAccount.bankName ?? data.virtualAccount.bank ?? '',
          accountNumber: data.virtualAccount.accountNumber ?? '',
          dueDate: data.virtualAccount.dueDate ?? '',
        }
      : undefined,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const langParam = searchParams.get('lang') ?? 'ko'
  const lang: Locale = LOCALES.includes(langParam as Locale) ? (langParam as Locale) : 'ko'
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amountStr = searchParams.get('amount')

  const failUrl = new URL(`/${lang}/checkout/fail`, request.url)
  const cartUrl = new URL(`/${lang}/cart`, request.url)

  if (!paymentKey || !orderId || !amountStr) {
    return NextResponse.redirect(cartUrl)
  }
  const amount = Number(amountStr)

  const confirmed = await confirmTossPayment(paymentKey, orderId, amount)
  if (!confirmed.ok) return NextResponse.redirect(failUrl)

  const cart = await getCart(lang)
  const shippingRaw = request.cookies.get('checkout_shipping')?.value

  let orderName: string | undefined
  let shipping: ReturnType<typeof JSON.parse> | undefined
  let items: { title: string; variantTitle: string; quantity: number; lineTotal: number }[] = []

  if (cart && shippingRaw) {
    try {
      shipping = JSON.parse(decodeURIComponent(shippingRaw))
      const lineItems = cart.lines.nodes.map((line) => ({
        variantGid: line.merchandise.id,
        quantity: line.quantity,
      }))
      const result = await createShopifyOrder({ orderId, amount, paymentKey, shipping, lineItems })
      if (result.ok) orderName = result.shopifyOrderName

      items = cart.lines.nodes.map((line) => ({
        title: line.merchandise.product.title,
        variantTitle: line.merchandise.title === 'Default Title' ? '' : line.merchandise.title,
        quantity: line.quantity,
        lineTotal: Number(line.merchandise.price.amount) * line.quantity,
      }))
    } catch (e) {
      console.error('[checkout/confirm] order creation failed:', e)
    }
  }

  // Meta CAPI Purchase (가상계좌는 입금 후 웹훅에서 별도 전송)
  if (!confirmed.virtualAccount && cart && shipping) {
    const contents = cart.lines.nodes.map((line) => ({
      id: line.merchandise.product.id.split('/').pop() ?? '',
      quantity: line.quantity,
      item_price: Number(line.merchandise.price.amount),
    }))
    sendCAPIEvent({
      eventName: 'Purchase',
      eventSourceUrl: `https://applebuttercollege.com/${lang}/checkout/complete`,
      value: amount,
      currency: 'KRW',
      orderId,
      contents,
      userData: {
        email: shipping.email,
        phone: shipping.phone,
        firstName: shipping.name,
        zipcode: shipping.zipcode,
        clientIp: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? undefined,
        clientUserAgent: request.headers.get('user-agent') ?? undefined,
        fbp: request.cookies.get('_fbp')?.value,
        fbc: request.cookies.get('_fbc')?.value,
      },
    }).catch(() => {})
  }

  const isVbank = confirmed.method === '가상계좌' || confirmed.method === 'VIRTUAL_ACCOUNT'

  // 표시 페이지가 읽을 확정 정보 — 부수효과 없는 순수 렌더용. httpOnly + 10분 만료.
  const payload = {
    orderName: orderName ?? '',
    isVbank,
    amount,
    vbank: confirmed.virtualAccount ?? null,
    shipping: shipping
      ? { name: shipping.name, address: shipping.address, addressDetail: shipping.addressDetail }
      : null,
    items,
  }

  const res = NextResponse.redirect(new URL(`/${lang}/checkout/complete`, request.url))
  res.cookies.set('order_confirmation', encodeURIComponent(JSON.stringify(payload)), {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })
  res.cookies.delete('cart_id')
  res.cookies.delete('checkout_shipping')
  return res
}
