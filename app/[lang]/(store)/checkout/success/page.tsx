import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { hasLocale } from '../../../dictionaries'

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>
}

async function confirmPayment(paymentKey: string, orderId: string, amount: number) {
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

  return res.ok
}

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const { paymentKey, orderId, amount } = await searchParams
  if (!paymentKey || !orderId || !amount) redirect(`/${lang}/cart`)

  const confirmed = await confirmPayment(paymentKey, orderId, Number(amount))
  if (!confirmed) redirect(`/${lang}/checkout/fail`)

  const cookieStore = await cookies()
  cookieStore.delete('cart_id')

  return (
    <section className="max-w-lg mx-auto px-4 py-24 text-center flex flex-col items-center gap-6">
      <div className="w-12 h-12 rounded-full bg-citrus flex items-center justify-center text-xl">
        ✓
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-base font-semibold">주문이 완료되었습니다</h1>
        <p className="text-sm text-ink-muted">주문번호: {orderId}</p>
      </div>
      <Link
        href={`/${lang}/products`}
        className="text-sm underline underline-offset-4 text-ink-muted hover:text-ink transition-colors"
      >
        쇼핑 계속하기
      </Link>
    </section>
  )
}
