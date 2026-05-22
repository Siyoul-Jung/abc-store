import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { hasLocale } from '../../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery, gidToId } from '@/lib/shopify/customer-account'
import CancelOrderButton from './_components/CancelOrderButton'

const SHOPIFY_STORE   = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_TOKEN   = process.env.SHOPIFY_ADMIN_API_TOKEN!
const API_VERSION     = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'

type Order = {
  id: string
  name: string
  number: number
  processedAt: string
  displayFulfillmentStatus: string
  totalPrice: { amount: string; currencyCode: string }
  lineItems: { edges: { node: { title: string; quantity: number } }[] }
}

type AdminOrderRaw = {
  id: number
  name: string
  order_number: number
  processed_at: string
  fulfillment_status: string | null
  total_price: string
  currency: string
  line_items: { name: string; quantity: number }[]
}

function mapAdminOrder(o: AdminOrderRaw): Order {
  return {
    id: `gid://shopify/Order/${o.id}`,
    name: o.name,
    number: o.order_number,
    processedAt: o.processed_at,
    displayFulfillmentStatus: o.fulfillment_status?.toUpperCase() ?? 'UNFULFILLED',
    totalPrice: { amount: o.total_price, currencyCode: o.currency },
    lineItems: {
      edges: o.line_items.slice(0, 2).map((item) => ({
        node: { title: item.name, quantity: item.quantity },
      })),
    },
  }
}

const dateLocale: Record<Locale, string> = { ko: 'ko-KR', ja: 'ja-JP', en: 'en-US' }
const t: Record<Locale, {
  empty: string; cta: string; returns: string
  cancel: string; cancelConfirm: string; cancelNo: string; cancelled: string; cancelError: string
}> = {
  ko: {
    empty: '주문 내역이 없습니다.', cta: '쇼핑하러 가기', returns: '반품 신청',
    cancel: '주문 취소', cancelConfirm: '취소 확인', cancelNo: '아니오',
    cancelled: '취소 완료', cancelError: '취소 실패 — 고객센터로 문의해 주세요',
  },
  ja: {
    empty: 'ご注文はありません。', cta: 'ショッピングを始める', returns: '返品申請',
    cancel: '注文キャンセル', cancelConfirm: 'キャンセルする', cancelNo: 'いいえ',
    cancelled: 'キャンセル済み', cancelError: 'キャンセル失敗 — お問い合わせください',
  },
  en: {
    empty: 'No orders yet.', cta: 'Start shopping', returns: 'Return',
    cancel: 'Cancel Order', cancelConfirm: 'Confirm', cancelNo: 'No',
    cancelled: 'Cancelled', cancelError: 'Cancel failed — please contact support',
  },
}

function formatPrice(amount: string, currency: string) {
  const n = Number(amount).toLocaleString()
  if (currency === 'KRW') return `${n}원`
  if (currency === 'JPY') return `${n}엔`
  return `${n} ${currency}`
}

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale

  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  let orders: Order[] = []

  console.log('[orders] token present:', !!token)
  if (token) {
    const caData = await caQuery<{ customer: { id: string } }>(token, `{ customer { id } }`)
    console.log('[orders] caData:', JSON.stringify(caData))
    const customerId = caData?.customer?.id?.split('/').pop()
    console.log('[orders] customerId:', customerId)
    if (customerId) {
      const res = await fetch(
        `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders.json?customer_id=${customerId}&status=any&limit=20`,
        { headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }, cache: 'no-store' }
      )
      console.log('[orders] admin api status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('[orders] order count:', (data.orders as unknown[]).length)
        orders = (data.orders as AdminOrderRaw[])
          .sort((a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime())
          .map(mapAdminOrder)
      }
    }
  }

  const labels = t[locale]

  return (
    <div>
      {orders.length === 0 ? (
        <div className="border border-border rounded-lg px-6 py-10 flex flex-col items-center gap-4 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-border">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <p className="text-sm text-ink-muted">{labels.empty}</p>
          <Link href={`/${lang}`} className="text-xs font-medium px-4 py-2 border border-border rounded-full hover:bg-surface transition-colors">
            {labels.cta}
          </Link>
        </div>
      ) : (
        <div className="border-t border-border">
          {orders.map((order) => (
            <div key={order.id} className="border-b border-border py-5">
              <div className="flex justify-between items-center mb-3">
                <Link href={`/${lang}/account/orders/${gidToId(order.id)}`}
                  className="text-sm font-semibold hover:text-ink-muted transition-colors">
                  {order.name}
                </Link>
                <span className="text-xs text-ink-muted">
                  {new Date(order.processedAt).toLocaleDateString(dateLocale[locale])}
                </span>
              </div>
              <div className="flex flex-col gap-1 mb-3">
                {order.lineItems.edges.map(({ node: item }) => (
                  <p key={item.title} className="text-sm text-ink-muted">
                    {item.title} <span className="text-ink-muted/60">× {item.quantity}</span>
                  </p>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{formatPrice(order.totalPrice.amount, order.totalPrice.currencyCode)}</p>
                <div className="flex items-center gap-2">
                  {order.displayFulfillmentStatus === 'UNFULFILLED' && (
                    <CancelOrderButton
                      orderId={order.id}
                      labels={{
                        cancel: labels.cancel,
                        confirm: labels.cancelConfirm,
                        no: labels.cancelNo,
                        cancelled: labels.cancelled,
                        error: labels.cancelError,
                      }}
                    />
                  )}
                  {order.displayFulfillmentStatus === 'FULFILLED' && (
                    <Link href={`/${lang}/returns`}
                      className="text-[11px] text-ink-muted hover:text-ink border border-border rounded-full px-3 py-1 transition-colors">
                      {labels.returns}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
