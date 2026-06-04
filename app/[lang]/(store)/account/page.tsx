import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'

type Customer = {
  firstName: string
  lastName: string
  emailAddress: { emailAddress: string } | null
  orders: { edges: unknown[] }
  addresses: { edges: unknown[] }
}

const QUERY = `{
  customer {
    firstName lastName
    emailAddress { emailAddress }
    orders(first: 1) { edges { node { id } } }
    addresses(first: 20) { edges { node { id } } }
  }
}`

const mockCustomer: Customer = {
  firstName: '길동', lastName: '홍',
  emailAddress: { emailAddress: 'test@example.com' },
  orders: { edges: [1, 2, 3] },
  addresses: { edges: [] },
}

const t: Record<Locale, { orders: string; addresses: string; logout: string; viewAll: string; contact: string; returns: string }> = {
  ko: { orders: '주문 내역', addresses: '배송지', logout: '로그아웃', viewAll: '전체보기 →', contact: '1:1 문의', returns: '반품 신청' },
  ja: { orders: '注文履歴', addresses: '配送先', logout: 'ログアウト', viewAll: 'すべて見る →', contact: '1:1 お問い合わせ', returns: '返品申請' },
  en: { orders: 'Orders', addresses: 'Addresses', logout: 'Log out', viewAll: 'View all →', contact: 'Contact Us', returns: 'Return Request' },
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale

  const isDev = process.env.NODE_ENV === 'development'
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  let customer: Customer | null = isDev ? mockCustomer : null
  if (!isDev && token) {
    const data = await caQuery<{ customer: Customer }>(token, QUERY)
    customer = data?.customer ?? null
  }
  if (!customer) return null

  const labels = t[locale]
  const displayName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '—'
  const initial = (customer.firstName || customer.lastName || '?')[0].toUpperCase()

  return (
    <div className="flex flex-col gap-8">

      {/* 프로필 카드 */}
      <div className="flex items-center gap-4 p-5 bg-surface rounded-xl border border-border">
        <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
          <span className="font-display text-lg font-semibold text-ink">{initial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{displayName}</p>
          {customer.emailAddress && (
            <p className="text-xs text-ink-muted mt-0.5 truncate">{customer.emailAddress.emailAddress}</p>
          )}
        </div>
        <a href={`/api/auth/logout?lang=${lang}`}
          className="text-xs text-ink-muted hover:text-ink transition-colors shrink-0">
          {labels.logout}
        </a>
      </div>

      {/* 빠른 링크 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/${lang}/account/orders`}
          className="p-5 border border-border rounded-xl hover:bg-surface transition-colors group">
          <p className="text-2xl font-display font-semibold mb-1">{customer.orders.edges.length > 0 ? customer.orders.edges.length + '+' : '0'}</p>
          <p className="text-sm text-ink-muted">{labels.orders}</p>
          <p className="text-xs text-ink-muted/60 mt-2 group-hover:text-ink-muted transition-colors">{labels.viewAll}</p>
        </Link>
        <Link href={`/${lang}/account/addresses`}
          className="p-5 border border-border rounded-xl hover:bg-surface transition-colors group">
          <p className="text-2xl font-display font-semibold mb-1">{customer.addresses.edges.length}</p>
          <p className="text-sm text-ink-muted">{labels.addresses}</p>
          <p className="text-xs text-ink-muted/60 mt-2 group-hover:text-ink-muted transition-colors">{labels.viewAll}</p>
        </Link>
      </div>

      {/* 바로가기 */}
      <div className="border border-border rounded-xl divide-y divide-border">
        <Link href={`/${lang}/qa`}
          className="flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors">
          <span className="text-sm">{labels.contact}</span>
          <span className="text-ink-muted text-xs">→</span>
        </Link>
        <Link href={`/${lang}/returns`}
          className="flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors">
          <span className="text-sm">{labels.returns}</span>
          <span className="text-ink-muted text-xs">→</span>
        </Link>
      </div>

    </div>
  )
}
