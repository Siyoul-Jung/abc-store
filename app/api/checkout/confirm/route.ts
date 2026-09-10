import { NextResponse, type NextRequest } from 'next/server'
import { getCart } from '@/lib/actions/cart'
import { createShopifyOrder, type ShippingData } from '@/lib/actions/order'
import { sendCAPIEvent } from '@/lib/meta-capi'
import { calcShipping, ISLAND_SURCHARGE, type ShippingCalc } from '@/lib/utils/shipping'
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

// 결제는 성공했는데 Shopify 주문이 생성되지 않은 경우(카트 누락·생성 실패) 관리자에게 즉시 알림.
// 돈은 빠져나갔으나 주문 기록이 없는 "무음 실패"를 운영자가 곧바로 인지·수동처리하도록.
async function alertAdminOrderCreationFailed(info: {
  orderId: string; paymentKey: string; amount: number; method: string
  email?: string; phone?: string; name?: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  if (!resendKey || !adminEmail) return
  const rows = [
    ['토스 주문ID', info.orderId],
    ['paymentKey', info.paymentKey],
    ['결제수단', info.method || '-'],
    ['결제금액', `${info.amount.toLocaleString()}원`],
    ['고객명', info.name ?? '-'],
    ['이메일', info.email ?? '-'],
    ['전화', info.phone ?? '-'],
  ]
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#9A8F88">${k}</td><td style="padding:4px 0"><b>${v}</b></td></tr>`)
    .join('')
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'applebuttercollege Support <support@applebuttercollege.com>',
      to: adminEmail,
      subject: `[⚠️ 결제완료·주문생성 실패] toss-${info.orderId}`,
      html: `<p><b>결제는 완료되었으나 Shopify 주문이 생성되지 않았습니다.</b> 수동 처리가 필요합니다.</p>`
        + `<table style="font-size:14px;border-collapse:collapse">${rows}</table>`
        + `<p style="margin-top:16px">조치: ① Shopify Admin에서 주문 수동 생성, 또는 ② 토스 대시보드에서 결제 취소(환불). 고객 화면에는 "주문 처리 지연" 안내가 표시되었습니다.</p>`,
    }),
  })
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

  // 결제 승인(캡처) 전에 카트를 확보해 금액을 서버에서 검증한다.
  // amount는 클라이언트가 requestPayment로 보낸 값이라 그대로 신뢰하지 않고,
  // 카트 원천(cost.subtotalAmount) + 서버 배송비 규칙으로 재계산해 대조한다.
  const cart = await getCart(lang)
  const shippingRaw = request.cookies.get('checkout_shipping')?.value

  let shipping: ShippingData | undefined
  let verified: ShippingCalc | undefined
  // 카트+배송지 쿠키가 있으면 금액 검증이 가능하다(정상 결제 흐름).
  const canVerify = !!(cart && cart.lines.nodes.length > 0 && shippingRaw)

  if (canVerify) {
    try {
      shipping = JSON.parse(decodeURIComponent(shippingRaw!)) as ShippingData
    } catch (e) {
      console.error('[checkout/confirm] 배송 쿠키 파싱 실패:', e)
      return NextResponse.redirect(failUrl)
    }

    // 🔒 재고 재검증 (오버셀 차단): 장바구니 담은 뒤 품절되거나 재고가 주문수량보다 적으면
    // 결제를 승인하지 않고 장바구니로 돌려보낸다.
    // availableForSale=false = 판매불가(품절, deny 정책). 품절허용(continue) 상품은
    // quantityAvailable<=0이어도 availableForSale=true라 통과된다(의도된 오버셀 허용).
    const oversold = cart!.lines.nodes.some((line) => {
      const v = line.merchandise
      if (!v.availableForSale) return true
      return v.quantityAvailable != null && v.quantityAvailable > 0 && v.quantityAvailable < line.quantity
    })
    if (oversold) {
      console.error('[checkout/confirm] 재고 부족 — 승인 중단(오버셀 방지)', { orderId })
      return NextResponse.redirect(new URL(`/${lang}/cart?notice=out_of_stock`, request.url))
    }

    const serverSubtotal = Number(cart!.cost.subtotalAmount.amount)
    verified = calcShipping(serverSubtotal, {
      zipcode: shipping.zipcode ?? '',
      // 도서·산간은 사용자 체크박스(선언값) — 결제액을 늘리는 방향이라 값 자체를 인정.
      isIsland: shipping.surcharge === ISLAND_SURCHARGE,
    })
    const expected = serverSubtotal + verified.shippingFee + verified.surcharge
    // 🔒 금액 위변조 차단: 서버 재계산값과 다르면 결제를 승인하지 않고 실패 처리.
    if (amount !== expected) {
      console.error('[checkout/confirm] 결제금액 불일치 — 위변조 의심, 승인 중단', { amount, expected, serverSubtotal })
      return NextResponse.redirect(failUrl)
    }
  }

  const confirmed = await confirmTossPayment(paymentKey, orderId, amount)
  if (!confirmed.ok) return NextResponse.redirect(failUrl)

  let orderName: string | undefined
  let orderOk = false
  let items: { title: string; variantTitle: string; quantity: number; lineTotal: number }[] = []

  // 카트가 비었으면(TTL 만료 등) 주문 생성을 건너뛴다 — orderOk=false로 아래 관리자 알림 경로.
  if (canVerify && cart && shipping && verified) {
    try {
      const lineItems = cart.lines.nodes.map((line) => ({
        variantGid: line.merchandise.id,
        quantity: line.quantity,
      }))
      // 주문 shipping_lines에는 쿠키 원본이 아닌 서버 검증 배송비를 사용한다.
      const result = await createShopifyOrder({
        orderId,
        amount,
        paymentKey,
        shipping: { ...shipping, shippingFee: verified.shippingFee, surcharge: verified.surcharge, surchargeLabel: verified.surchargeLabel },
        lineItems,
        vbankDueDate: confirmed.virtualAccount?.dueDate,
      })
      if (result.ok) {
        orderName = result.shopifyOrderName
        orderOk = true
      }

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

  // 결제는 성공(confirmed.ok)했는데 주문이 생성되지 않은 경우 — 무음 실패 방지.
  // 고객에겐 지연 안내를 띄우고(payload.orderFailed), 관리자에겐 즉시 알린다.
  if (!orderOk) {
    console.error('[checkout/confirm] paid but order NOT created', { orderId, paymentKey, amount })
    alertAdminOrderCreationFailed({
      orderId,
      paymentKey,
      amount,
      method: confirmed.method,
      email: shipping?.email,
      phone: shipping?.phone,
      name: shipping?.name,
    }).catch(() => {})
  }

  // Meta CAPI Purchase (가상계좌는 입금 후 웹훅에서 별도 전송, 주문 생성 실패 시 미전송)
  if (!confirmed.virtualAccount && orderOk && cart && shipping) {
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
    orderFailed: !orderOk,
    orderRef: orderId,
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
