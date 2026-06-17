import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale, getDictionary } from '../../dictionaries'
import { getCart } from '@/lib/actions/cart'
import { caQuery } from '@/lib/shopify/customer-account'
import CheckoutForm from '@/components/checkout/CheckoutForm'
import type { Locale } from '@/lib/shopify/types'

type Props = { params: Promise<{ lang: string }> }

type SavedAddress = {
  id: string; name: string; phone: string
  zipcode: string; address: string; addressDetail: string
  isDefault: boolean
}
type CheckoutAccount = { email: string; addresses: SavedAddress[] }

// 로그인 고객이면 계정 이메일 + 저장된 배송지 목록을 가져와 체크아웃에 전달한다.
// 이메일/주소는 별도 쿼리 — 주소 쿼리가 실패해도 이메일은 살리기 위함(리스크 분리).
// CA API 필드명은 공식 스키마 기준(zip / phoneNumber). 실패 시 게스트와 동일하게 빈 폼.
async function getAccount(): Promise<CheckoutAccount | undefined> {
  // 개발 모드: 로컬은 OIDC 로그인이 안 되므로(콜백 미등록) mock으로 UX 확인.
  // account 페이지들과 동일한 관례. 운영에는 영향 없음.
  if (process.env.NODE_ENV === 'development') {
    return {
      email: 'test@example.com',
      addresses: [
        { id: 'gid://shopify/CustomerAddress/1', name: '홍길동', phone: '010-1234-5678', zipcode: '12265', address: '경기도 남양주시 다산순환로 20', addressDetail: '10층', isDefault: true },
        { id: 'gid://shopify/CustomerAddress/2', name: '홍길동', phone: '010-9876-5432', zipcode: '63000', address: '제주특별자치도 제주시 첨단로 242', addressDetail: '2층', isDefault: false },
      ],
    }
  }

  const token = (await cookies()).get('customer_token')?.value
  if (!token) return undefined

  const [emailRes, addrRes] = await Promise.all([
    caQuery<{ customer: { emailAddress?: { emailAddress?: string } } }>(
      token,
      `{ customer { emailAddress { emailAddress } } }`,
    ),
    caQuery<{ customer: {
      defaultAddress?: { id?: string } | null
      addresses?: { edges: { node: {
        id: string; firstName?: string; lastName?: string
        address1?: string; address2?: string; zip?: string; phoneNumber?: string
      } }[] }
    } }>(
      token,
      `{ customer {
        defaultAddress { id }
        addresses(first: 20) { edges { node { id firstName lastName address1 address2 zip phoneNumber } } }
      } }`,
    ),
  ])

  const email = emailRes?.customer?.emailAddress?.emailAddress ?? ''
  const defaultId = addrRes?.customer?.defaultAddress?.id
  const nodes = addrRes?.customer?.addresses?.edges?.map((e) => e.node) ?? []
  const addresses: SavedAddress[] = nodes.map((n) => ({
    id: n.id,
    // 한국 표기 순서(성+이름)로 합쳐 단일 이름 필드에 채움
    name: `${n.lastName ?? ''}${n.firstName ?? ''}`.trim(),
    phone: n.phoneNumber ?? '',
    zipcode: n.zip ?? '',
    address: n.address1 ?? '',
    addressDetail: n.address2 ?? '',
    isDefault: n.id === defaultId,
  }))

  if (!email && addresses.length === 0) return undefined
  return { email, addresses }
}

// 비회원 결제 허용 — 로그인 강제 시 모바일 충동구매(인스타 유입) 이탈이 커서.
// 주문은 cart + 배송지 쿠키로 생성되며 로그인 토큰에 의존하지 않는다.
// 로그인 고객의 주문은 체크아웃 이메일이 계정 이메일과 같으면 마이페이지에 연결됨.
export default async function CheckoutPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const [cart, dict, account] = await Promise.all([
    getCart(lang as Locale),
    getDictionary(lang as Locale),
    getAccount(),
  ])

  if (!cart || cart.lines.nodes.length === 0) redirect(`/${lang}/cart`)

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-lg font-semibold mb-8 break-keep">{dict.checkout.title}</h1>
      <CheckoutForm cart={cart} locale={lang as Locale} dict={dict} account={account} />
    </section>
  )
}
