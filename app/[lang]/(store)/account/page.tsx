import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'
import { getMyQuestions } from '@/lib/actions/qa'

type Customer = {
  id: string
  firstName: string
  lastName: string
  emailAddress: { emailAddress: string } | null
  orders: { edges: unknown[] }
  addresses: { edges: unknown[] }
}

const QUERY = `{
  customer {
    id firstName lastName
    emailAddress { emailAddress }
    orders(first: 1) { edges { node { id } } }
    addresses(first: 20) { edges { node { id } } }
  }
}`

const mockCustomer: Customer = {
  id: 'gid://shopify/Customer/0',
  firstName: '길동', lastName: '홍',
  emailAddress: { emailAddress: 'test@example.com' },
  orders: { edges: [1, 2, 3] },
  addresses: { edges: [] },
}

const t: Record<Locale, { orders: string; addresses: string; logout: string; viewAll: string; contact: string; returns: string; loggedInAs: string; answered: string }> = {
  ko: { orders: '주문 내역', addresses: '배송지', logout: '로그아웃', viewAll: '전체보기 →', contact: '1:1 문의', returns: '반품 신청', loggedInAs: '로그인 계정', answered: '답변완료' },
  ja: { orders: '注文履歴', addresses: '配送先', logout: 'ログアウト', viewAll: 'すべて見る →', contact: '1:1 お問い合わせ', returns: '返品申請', loggedInAs: 'ログイン中', answered: '回答済み' },
  en: { orders: 'Orders', addresses: 'Addresses', logout: 'Log out', viewAll: 'View all →', contact: 'Contact Us', returns: 'Return Request', loggedInAs: 'Signed in as', answered: 'Answered' },
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
  const initial = (customer.firstName || customer.lastName || '?')[0].toUpperCase()

  // 내 문의 답변 현황 (계정 홈에서 답변 도착 여부를 바로 알 수 있게)
  let qTotal = 0
  let qAnswered = 0
  if (isDev) {
    qTotal = 2
    qAnswered = 1
  } else if (customer.id) {
    const myQs = await getMyQuestions(customer.id)
    qTotal = myQs.length
    qAnswered = myQs.filter((q: { status: string }) => q.status === 'answered').length
  }

  return (
    <div className="flex flex-col gap-8">

      {/* 프로필 카드 */}
      <div className="flex items-center gap-4 p-5 bg-surface rounded-xl border border-border">
        <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center shrink-0">
          <span className="font-display text-lg font-semibold text-ink">{initial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-0.5">{labels.loggedInAs}</p>
          <p className="text-sm font-medium truncate">{customer.emailAddress?.emailAddress ?? '—'}</p>
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
          <span className="flex items-center gap-2">
            {qAnswered > 0 ? (
              <span className="text-[11px] font-medium text-coral">{labels.answered} {qAnswered}</span>
            ) : qTotal > 0 ? (
              <span className="text-[11px] text-ink-muted">{qTotal}</span>
            ) : null}
            <span className="text-ink-muted text-xs">→</span>
          </span>
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
