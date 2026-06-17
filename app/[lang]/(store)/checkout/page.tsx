import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale, getDictionary } from '../../dictionaries'
import { getCart } from '@/lib/actions/cart'
import { caQuery } from '@/lib/shopify/customer-account'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import type { Locale } from '@/lib/shopify/types'

type Props = { params: Promise<{ lang: string }> }

type CheckoutInitial = {
  name: string; phone: string; email: string
  zipcode: string; address: string; addressDetail: string
}

// 로그인 고객이면 계정 이메일 + 기본 배송지로 체크아웃 폼을 미리 채운다.
// 이메일과 주소는 별도 쿼리 — CA API 주소 필드명이 미검증이라, 주소 쿼리가 실패해도
// 이메일 prefill은 살리기 위함(리스크 분리). 둘 다 best-effort, 실패 시 빈 폼(게스트와 동일).
async function getInitial(): Promise<CheckoutInitial | undefined> {
  const token = (await cookies()).get('customer_token')?.value
  if (!token) return undefined

  const [emailRes, addrRes] = await Promise.all([
    caQuery<{ customer: { emailAddress?: { emailAddress?: string } } }>(
      token,
      `{ customer { emailAddress { emailAddress } } }`,
    ),
    caQuery<{ customer: { defaultAddress?: {
      firstName?: string; lastName?: string; address1?: string
      address2?: string; zip?: string; phoneNumber?: string
    } | null } }>(
      token,
      `{ customer { defaultAddress { firstName lastName address1 address2 zip phoneNumber } } }`,
    ),
  ])

  const email = emailRes?.customer?.emailAddress?.emailAddress ?? ''
  const a = addrRes?.customer?.defaultAddress
  if (!email && !a) return undefined

  return {
    email,
    // 한국 표기 순서(성+이름)로 합쳐 단일 이름 필드에 채움
    name: a ? `${a.lastName ?? ''}${a.firstName ?? ''}`.trim() : '',
    phone: a?.phoneNumber ?? '',
    zipcode: a?.zip ?? '',
    address: a?.address1 ?? '',
    addressDetail: a?.address2 ?? '',
  }
}

// 비회원 결제 허용 — 로그인 강제 시 모바일 충동구매(인스타 유입) 이탈이 커서.
// 주문은 cart + 배송지 쿠키로 생성되며 로그인 토큰에 의존하지 않는다.
// 로그인 고객의 주문은 체크아웃 이메일이 계정 이메일과 같으면 마이페이지에 연결됨.
export default async function CheckoutPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const [cart, dict, initial] = await Promise.all([
    getCart(lang as Locale),
    getDictionary(lang as Locale),
    getInitial(),
  ])

  if (!cart || cart.lines.nodes.length === 0) redirect(`/${lang}/cart`)

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-lg font-semibold mb-8 break-keep">{dict.checkout.title}</h1>
      <CheckoutForm cart={cart} locale={lang as Locale} dict={dict} initial={initial} />
    </section>
  )
}
