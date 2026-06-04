import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { hasLocale } from '../../../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'
import CancelButton from './_components/CancelButton'

type OrderDetail = {
  id: string
  number: number
  processedAt: string
  displayFulfillmentStatus: string
  tags: string[]
  totalPrice: { amount: string; currencyCode: string }
  subtotalPrice: { amount: string; currencyCode: string }
  totalShippingPrice: { amount: string; currencyCode: string }
  shippingAddress: {
    firstName: string; lastName: string
    address1: string; address2: string | null
    city: string; province: string | null; zip: string; country: string
  } | null
  lineItems: {
    edges: {
      node: {
        title: string; quantity: number
        price: { amount: string; currencyCode: string }
      }
    }[]
  }
}

const QUERY = `
  query GetOrder($id: ID!) {
    order(id: $id) {
      id number processedAt displayFulfillmentStatus tags
      totalPrice { amount currencyCode }
      subtotalPrice { amount currencyCode }
      totalShippingPrice { amount currencyCode }
      shippingAddress {
        firstName lastName address1 address2 city province zip country
      }
      lineItems(first: 20) {
        edges {
          node {
            title quantity
            price { amount currencyCode }
          }
        }
      }
    }
  }
`

const mockOrder: OrderDetail = {
  id: 'gid://shopify/Order/1',
  number: 1001,
  processedAt: '2026-04-10T00:00:00Z',
  displayFulfillmentStatus: 'UNFULFILLED',
  tags: [],
  totalPrice: { amount: '49000', currencyCode: 'KRW' },
  subtotalPrice: { amount: '45500', currencyCode: 'KRW' },
  totalShippingPrice: { amount: '3500', currencyCode: 'KRW' },
  shippingAddress: { firstName: '길동', lastName: '홍', address1: '다산순환로 20', address2: '10층', city: '남양주시', province: '경기도', zip: '12265', country: 'KR' },
  lineItems: { edges: [{ node: { title: '베이직 반팔 티셔츠 (M)', quantity: 2, price: { amount: '22750', currencyCode: 'KRW' } } }] },
}

const dateLocale: Record<Locale, string> = { ko: 'ko-KR', ja: 'ja-JP', en: 'en-US' }
const t: Record<Locale, { back: string; items: string; shipping: string; subtotal: string; shippingFee: string; total: string; address: string; returns: string; contact: string; cancel: string; cancelConfirm: string }> = {
  ko: { back: '← 주문 목록', items: '주문 상품', shipping: '배송지', subtotal: '상품 합계', shippingFee: '배송비', total: '결제 금액', address: '배송 주소', returns: '반품 신청', contact: '1:1 문의', cancel: '주문 취소', cancelConfirm: '주문을 취소하시겠어요? 결제 금액이 자동 환불됩니다.' },
  ja: { back: '← 注文一覧', items: 'ご注文商品', shipping: 'お届け先', subtotal: '小計', shippingFee: '送料', total: 'お支払い金額', address: 'お届け先住所', returns: '返品申請', contact: '1:1 お問い合わせ', cancel: '注文キャンセル', cancelConfirm: 'ご注文をキャンセルしますか？ご決済金額は自動的に返金されます。' },
  en: { back: '← Orders', items: 'Items', shipping: 'Shipping', subtotal: 'Subtotal', shippingFee: 'Shipping fee', total: 'Total', address: 'Shipping address', returns: 'Request return', contact: 'Contact Us', cancel: 'Cancel order', cancelConfirm: 'Cancel this order? Your payment will be refunded automatically.' },
}

function formatPrice(amount: string, currency: string) {
  const n = Number(amount).toLocaleString()
  if (currency === 'KRW') return `${n}원`
  if (currency === 'JPY') return `${n}엔`
  return `${n} ${currency}`
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale

  const isDev = process.env.NODE_ENV === 'development'
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  let order: OrderDetail | null = isDev ? mockOrder : null
  if (!isDev && token) {
    const gid = `gid://shopify/Order/${id}`
    const data = await caQuery<{ order: OrderDetail }>(token, QUERY, { id: gid })
    order = data?.order ?? null
  }
  if (!order) notFound()

  const labels = t[locale]
  const canCancel = order.displayFulfillmentStatus === 'UNFULFILLED' && !order.tags.includes('packing')

  return (
    <div className="flex flex-col gap-8">

      <div className="flex items-center justify-between">
        <Link href={`/${lang}/account/orders`} className="text-sm text-ink-muted hover:text-ink transition-colors">
          {labels.back}
        </Link>
        <span className="text-sm font-semibold">#{order.number}</span>
        <span className="text-xs text-ink-muted">
          {new Date(order.processedAt).toLocaleDateString(dateLocale[locale])}
        </span>
      </div>

      {/* 주문 상품 */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-3">{labels.items}</p>
        <div className="border-t border-border">
          {order.lineItems.edges.map(({ node: item }) => (
            <div key={item.title} className="flex justify-between items-start py-4 border-b border-border">
              <div>
                <p className="text-sm">{item.title}</p>
                <p className="text-xs text-ink-muted mt-0.5">× {item.quantity}</p>
              </div>
              <p className="text-sm font-medium shrink-0 ml-4">
                {formatPrice(String(Number(item.price.amount) * item.quantity), item.price.currencyCode)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 금액 요약 */}
      <div className="bg-surface rounded-xl p-5 flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">{labels.subtotal}</span>
          <span>{formatPrice(order.subtotalPrice.amount, order.subtotalPrice.currencyCode)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">{labels.shippingFee}</span>
          <span>{Number(order.totalShippingPrice.amount) === 0 ? (locale === 'ko' ? '무료' : locale === 'ja' ? '無料' : 'Free') : formatPrice(order.totalShippingPrice.amount, order.totalShippingPrice.currencyCode)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border mt-1">
          <span>{labels.total}</span>
          <span>{formatPrice(order.totalPrice.amount, order.totalPrice.currencyCode)}</span>
        </div>
      </div>

      {/* 배송지 */}
      {order.shippingAddress && (
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-3">{labels.address}</p>
          <div className="text-sm text-ink-muted leading-relaxed border border-border rounded-xl p-4">
            <p className="font-medium text-ink">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
            <p>{order.shippingAddress.address1}{order.shippingAddress.address2 ? ` ${order.shippingAddress.address2}` : ''}</p>
            <p>{order.shippingAddress.city}{order.shippingAddress.province ? `, ${order.shippingAddress.province}` : ''} {order.shippingAddress.zip}</p>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/${lang}/returns`}
          className="text-center text-sm py-3 border border-border rounded-lg hover:bg-surface transition-colors">
          {labels.returns}
        </Link>
        <Link href={`/${lang}/qa/new`}
          className="text-center text-sm py-3 border border-border rounded-lg hover:bg-surface transition-colors">
          {labels.contact}
        </Link>
      </div>

      {canCancel && (
        <CancelButton
          orderId={order.id}
          label={labels.cancel}
          confirmMessage={labels.cancelConfirm}
        />
      )}

    </div>
  )
}
