import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../dictionaries'
import ReturnForm from '@/components/returns/ReturnForm'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'
import type { CustomerOrder } from '@/components/returns/ReturnForm'

const ORDERS_QUERY = `{
  customer {
    firstName
    lastName
    orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
      edges {
        node {
          id name processedAt displayFulfillmentStatus
          lineItems(first: 3) { edges { node { title } } }
        }
      }
    }
  }
}`

type Props = { params: Promise<{ lang: string }> }

export default async function ReturnsPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const isDev = process.env.NODE_ENV === 'development'
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  if (!isDev && !token) {
    redirect(`/api/auth/login?redirect=/${lang}/returns`)
  }

  let orders: CustomerOrder[] = []
  let customerName = ''

  if (token) {
    const data = await caQuery<{
      customer: {
        firstName: string
        lastName: string
        orders: { edges: { node: CustomerOrder & { displayFulfillmentStatus: string } }[] }
      }
    }>(token, ORDERS_QUERY)

    if (data?.customer) {
      customerName = `${data.customer.firstName ?? ''} ${data.customer.lastName ?? ''}`.trim()
      orders = data.customer.orders.edges
        .map(e => e.node)
        .filter(o => o.displayFulfillmentStatus === 'FULFILLED')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="max-w-md mx-auto">
        <ReturnForm locale={lang as Locale} orders={orders} customerName={customerName} />
      </div>
    </div>
  )
}
