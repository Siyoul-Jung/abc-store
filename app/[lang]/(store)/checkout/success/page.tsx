import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { hasLocale } from '../../../dictionaries'
import { getCart } from '@/lib/actions/cart'
import { createShopifyOrder } from '@/lib/actions/order'
import { sendCAPIEvent } from '@/lib/meta-capi'
import type { Locale } from '@/lib/shopify/types'

type TossVirtualAccount = {
  bankName: string
  accountNumber: string
  customerName: string
  dueDate: string
}

type TossConfirmResult =
  | { ok: false }
  | { ok: true; method: string; virtualAccount?: TossVirtualAccount }

async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<TossConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY!
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')

  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
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
          customerName: data.virtualAccount.customerName ?? '',
          dueDate: data.virtualAccount.dueDate ?? '',
        }
      : undefined,
  }
}

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>
}

const t: Record<Locale, {
  titleCard: string; titleVbank: string
  orderNum: string
  items: string; total: string; shippingAddr: string
  depositGuide: string; depositBank: string; depositAccount: string; depositAmount: string; depositDue: string
  depositNote: string
  continueShopping: string
}> = {
  ko: {
    titleCard: '주문이 완료되었습니다',
    titleVbank: '입금 계좌를 확인해 주세요',
    orderNum: '주문번호',
    items: '주문 상품',
    total: '결제 금액',
    shippingAddr: '배송지',
    depositGuide: '아래 계좌로 입금하시면 주문이 확정됩니다.',
    depositBank: '은행',
    depositAccount: '계좌번호',
    depositAmount: '입금 금액',
    depositDue: '입금 기한',
    depositNote: '입금자명은 주문자명과 동일하게 입력해 주세요.',
    continueShopping: '쇼핑 계속하기',
  },
  ja: {
    titleCard: 'ご注文が完了しました',
    titleVbank: '振込先口座をご確認ください',
    orderNum: '注文番号',
    items: 'ご注文商品',
    total: 'お支払い金額',
    shippingAddr: 'お届け先',
    depositGuide: '下記の口座へお振込みいただくとご注文が確定します。',
    depositBank: '銀行名',
    depositAccount: '口座番号',
    depositAmount: 'お振込み金額',
    depositDue: '振込期限',
    depositNote: '振込名義はご注文者名と同じにしてください。',
    continueShopping: 'ショッピングを続ける',
  },
  en: {
    titleCard: 'Order Confirmed',
    titleVbank: 'Please complete your bank transfer',
    orderNum: 'Order',
    items: 'Items',
    total: 'Total',
    shippingAddr: 'Ship to',
    depositGuide: 'Your order will be confirmed once we receive your payment.',
    depositBank: 'Bank',
    depositAccount: 'Account Number',
    depositAmount: 'Amount',
    depositDue: 'Due Date',
    depositNote: 'Please use your name as the transfer reference.',
    continueShopping: 'Continue Shopping',
  },
}

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale

  const { paymentKey, orderId, amount } = await searchParams
  if (!paymentKey || !orderId || !amount) redirect(`/${lang}/cart`)

  const confirmed = await confirmTossPayment(paymentKey, orderId, Number(amount))
  if (!confirmed.ok) redirect(`/${lang}/checkout/fail`)

  const [cookieStore, headersList] = await Promise.all([cookies(), headers()])
  const cart = await getCart(locale)
  const shippingRaw = cookieStore.get('checkout_shipping')?.value

  let shopifyOrderName: string | undefined
  let shipping: ReturnType<typeof JSON.parse> | undefined

  if (cart && shippingRaw) {
    try {
      shipping = JSON.parse(decodeURIComponent(shippingRaw))
      const lineItems = cart.lines.nodes.map((line) => ({
        variantGid: line.merchandise.id,
        quantity: line.quantity,
      }))
      const result = await createShopifyOrder({ orderId, amount: Number(amount), paymentKey, shipping, lineItems })
      if (result.ok) shopifyOrderName = result.shopifyOrderName
    } catch (e) {
      console.error('[success] order creation failed:', e)
    }
  }

  // Meta CAPI Purchase 이벤트 (가상계좌는 입금 후 웹훅에서 별도 전송)
  if (confirmed.ok && !confirmed.virtualAccount && cart && shipping) {
    const contents = cart.lines.nodes.map((line) => ({
      id: line.merchandise.product.id.split('/').pop() ?? '',
      quantity: line.quantity,
      item_price: Number(line.merchandise.price.amount),
    }))
    sendCAPIEvent({
      eventName: 'Purchase',
      eventSourceUrl: `https://applebuttercollege.com/${lang}/checkout/success`,
      value: Number(amount),
      currency: 'KRW',
      orderId,
      contents,
      userData: {
        email: shipping.email,
        phone: shipping.phone,
        firstName: shipping.name,
        zipcode: shipping.zipcode,
        clientIp: headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headersList.get('x-real-ip') ?? undefined,
        clientUserAgent: headersList.get('user-agent') ?? undefined,
        fbp: cookieStore.get('_fbp')?.value,
        fbc: cookieStore.get('_fbc')?.value,
      },
    }).catch(() => {})
  }

  cookieStore.delete('cart_id')
  cookieStore.delete('checkout_shipping')

  const d = t[locale]
  const isVbank = confirmed.method === '가상계좌' || confirmed.method === 'VIRTUAL_ACCOUNT'
  const va = confirmed.virtualAccount

  return (
    <section className="max-w-lg mx-auto px-4 py-16 sm:py-24 flex flex-col items-center gap-6">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isVbank ? 'bg-surface' : 'bg-citrus'}`}>
        {isVbank ? '💳' : '✓'}
      </div>

      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-base font-semibold break-keep">{isVbank ? d.titleVbank : d.titleCard}</h1>
        {shopifyOrderName && (
          <p className="text-sm text-ink-muted">{d.orderNum}: {shopifyOrderName}</p>
        )}
      </div>

      {/* 주문 요약 */}
      {cart && (
        <div className="w-full border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-surface">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted">{d.items}</p>
          </div>
          <div className="divide-y divide-border">
            {cart.lines.nodes.map((line) => (
              <div key={line.id} className="flex justify-between items-start px-5 py-3 text-sm">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="truncate">{line.merchandise.product.title}</p>
                  {line.merchandise.title !== 'Default Title' && (
                    <p className="text-xs text-ink-muted mt-0.5">{line.merchandise.title}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-ink-muted text-xs">×{line.quantity}</p>
                  <p className="font-medium">{(Number(line.merchandise.price.amount) * line.quantity).toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-5 py-3 border-t border-border bg-surface">
            <span className="text-sm font-semibold">{d.total}</span>
            <span className="text-sm font-semibold">{Number(amount).toLocaleString()}원</span>
          </div>
        </div>
      )}

      {/* 배송지 */}
      {shipping && (
        <div className="w-full border border-border rounded-xl px-5 py-4">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-2">{d.shippingAddr}</p>
          <p className="text-sm">{shipping.name}</p>
          <p className="text-sm text-ink-muted">{shipping.address} {shipping.addressDetail}</p>
        </div>
      )}

      {/* 가상계좌 입금 안내 */}
      {isVbank && va && (
        <div className="w-full border border-border p-5 flex flex-col gap-3">
          <p className="text-xs text-ink-muted">{d.depositGuide}</p>
          <div className="flex flex-col gap-2">
            {[
              [d.depositBank, va.bankName],
              [d.depositAccount, va.accountNumber],
              [d.depositAmount, `${Number(amount).toLocaleString()}원`],
              [d.depositDue, va.dueDate ? new Date(va.dueDate).toLocaleString('ko-KR') : ''],
            ].map(([label, value]) => value && (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-ink-muted">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-muted border-t border-border pt-3">{d.depositNote}</p>
        </div>
      )}

      <Link
        href={`/${lang}/collections/new`}
        className="text-sm underline underline-offset-4 text-ink-muted hover:text-ink transition-colors mt-2"
      >
        {d.continueShopping}
      </Link>
    </section>
  )
}
