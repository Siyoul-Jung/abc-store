import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../../dictionaries'
import { caQuery } from '@/lib/shopify/customer-account'
import type { Locale } from '@/lib/shopify/types'
import NewQuestionForm from './_components/NewQuestionForm'

const pageLabels: Record<Locale, { title: string; back: string }> = {
  ko: { title: '문의 작성', back: '← 고객센터' },
  ja: { title: 'お問い合わせ', back: '← カスタマーセンター' },
  en: { title: 'Ask a question', back: '← Support' },
}

const ORDERS_QUERY = `
  query {
    customer {
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          name
          processedAt
          lineItems(first: 3) {
            nodes { title quantity }
          }
        }
      }
    }
  }
`

type OrdersData = {
  customer: {
    orders: {
      nodes: Array<{
        id: string
        name: string
        processedAt: string
        lineItems: { nodes: { title: string; quantity: number }[] }
      }>
    }
  }
}

export type CustomerOrder = OrdersData['customer']['orders']['nodes'][number]

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale

  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value
  const isDev = process.env.NODE_ENV === 'development'

  if (!isDev && !token) redirect(`/api/auth/login?redirect=/${lang}/qa/new`)

  const ordersData = token ? await caQuery<OrdersData>(token, ORDERS_QUERY) : null
  const orders = ordersData?.customer?.orders?.nodes ?? []

  const labels = pageLabels[locale]

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div className="mb-8">
        <a href={`/${lang}/qa`} className="text-sm text-ink-muted hover:text-ink transition-colors">{labels.back}</a>
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-8 break-keep">{labels.title}</h1>
      <NewQuestionForm lang={locale} orders={orders} />
    </div>
  )
}
