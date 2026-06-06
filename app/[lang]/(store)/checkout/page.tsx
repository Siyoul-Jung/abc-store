import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale, getDictionary } from '../../dictionaries'
import { getCart } from '@/lib/actions/cart'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import type { Locale } from '@/lib/shopify/types'

type Props = { params: Promise<{ lang: string }> }

export default async function CheckoutPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value
  if (!token) redirect(`/api/auth/login?redirect=/${lang}/checkout`)

  const [cart, dict] = await Promise.all([
    getCart(lang as Locale),
    getDictionary(lang as Locale),
  ])

  if (!cart || cart.lines.nodes.length === 0) redirect(`/${lang}/cart`)

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-lg font-semibold mb-8 break-keep">{dict.checkout.title}</h1>
      <CheckoutForm cart={cart} locale={lang as Locale} dict={dict} />
    </section>
  )
}
