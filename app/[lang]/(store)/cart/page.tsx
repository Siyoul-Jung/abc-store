import { notFound } from 'next/navigation'
import Link from 'next/link'
import { hasLocale, getDictionary } from '../../dictionaries'
import { getCart } from '@/lib/actions/cart'
import { formatPrice } from '@/lib/utils/format'
import CartLineItem from '@/components/cart/CartLineItem'
import type { Locale } from '@/lib/shopify/types'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ notice?: string }> }

export default async function CartPage({ params, searchParams }: Props) {
  const { lang } = await params
  const { notice } = await searchParams
  if (!hasLocale(lang)) notFound()

  const [cart, dict] = await Promise.all([
    getCart(lang as Locale),
    getDictionary(lang as Locale),
  ])

  if (!cart || cart.lines.nodes.length === 0) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center">
        <p className="text-ink-muted text-sm mb-6">{dict.cart.empty}</p>
        <Link
          href={`/${lang}/products`}
          className="text-sm underline underline-offset-4 hover:text-accent transition-colors"
        >
          {dict.common.viewAll}
        </Link>
      </section>
    )
  }

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {notice === 'checkout_paused' && (
        <div className="mb-6 px-4 py-3 bg-citrus/30 border border-citrus rounded-xl text-sm text-ink">
          {lang === 'ja'
            ? '現在、決済機能は準備中です。もうしばらくお待ちください。'
            : '현재 결제 기능을 준비 중입니다. 조금만 기다려 주세요.'}
        </div>
      )}
      <h1 className="text-lg font-semibold mb-8 break-keep">{dict.cart.title}</h1>

      <div>
        {cart.lines.nodes.map((line) => (
          <CartLineItem key={line.id} line={line} locale={lang as Locale} />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex justify-between text-sm py-4 border-t border-border">
          <span className="text-ink-muted">{dict.cart.total}</span>
          <span className="font-semibold">
            {formatPrice(
              cart.cost.totalAmount.amount,
              cart.cost.totalAmount.currencyCode,
              lang as Locale,
            )}
          </span>
        </div>

        <Link
          href={`/${lang}/checkout`}
          className="w-full bg-coral text-white text-sm font-medium tracking-widest uppercase py-4 text-center hover:opacity-90 transition-opacity"
        >
          {dict.cart.checkout}
        </Link>
      </div>
    </section>
  )
}
