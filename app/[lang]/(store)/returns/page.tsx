import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../dictionaries'
import ReturnForm from '@/components/returns/ReturnForm'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'
import type { CustomerOrder } from '@/components/returns/ReturnForm'

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!
const API_VERSION   = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'

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
    // CA API로 이름 확인
    const customerData = await caQuery<{
      customer: { firstName: string; lastName: string }
    }>(token, `{ customer { firstName lastName } }`)
    if (customerData?.customer) {
      const c = customerData.customer
      customerName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
    }

    const caData = await caQuery<{ customer: { id: string } }>(token, `{ customer { id } }`)
    const customerId = caData?.customer?.id?.split('/').pop()
    if (customerId) {
      const res = await fetch(
        `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders.json?customer_id=${customerId}&status=any&limit=20`,
        { headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }, cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        orders = (data.orders as {
          id: number; name: string; processed_at: string
          fulfillment_status: string | null
          line_items: { name: string }[]
        }[])
          .filter(o => o.fulfillment_status === 'fulfilled')
          .map(o => ({
            id: `gid://shopify/Order/${o.id}`,
            name: o.name,
            processedAt: o.processed_at,
            lineItems: { edges: o.line_items.slice(0, 3).map(i => ({ node: { title: i.name } })) },
          }))
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-md mx-auto">
        <ReturnForm locale={lang as Locale} orders={orders} customerName={customerName} />
      </div>
    </div>
  )
}
