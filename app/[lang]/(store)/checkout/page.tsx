import { notFound, redirect } from 'next/navigation'
import { hasLocale, getDictionary } from '../../dictionaries'
import { getCart } from '@/lib/actions/cart'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import type { Locale } from '@/lib/shopify/types'

type Props = { params: Promise<{ lang: string }> }

// 비회원 결제 허용 — 로그인 강제 시 모바일 충동구매(인스타 유입) 이탈이 커서.
// 주문은 cart + 배송지 쿠키로 생성되며 로그인 토큰에 의존하지 않는다.
// 로그인 고객의 주문은 체크아웃 이메일이 계정 이메일과 같으면 마이페이지에 연결됨.
export default async function CheckoutPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

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
