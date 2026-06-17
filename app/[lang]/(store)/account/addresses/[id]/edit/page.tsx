import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../../../../dictionaries'
import { caQuery, gidToId } from '@/lib/shopify/customer-account'
import { updateAddress } from '@/lib/actions/account'
import AddressForm from '../../_components/AddressForm'

// 폼이 다루는 표시값 (저장 시 AddressForm이 CustomerAddressInput으로 변환)
type FormValues = {
  name: string; phone: string
  zipcode: string; address: string; addressDetail: string; zoneCode: string
}

type AddressNode = {
  id: string; firstName?: string; lastName?: string
  address1?: string; address2?: string; zip?: string; phoneNumber?: string
}

// zoneCode는 읽기 쿼리에 넣지 않는다(유효하지 않으면 쿼리 전체가 실패 → 폼이 빈칸).
// 저장 시 주소 문자열에서 역산한다(AddressForm).
const QUERY = `{
  customer {
    addresses(first: 20) {
      edges { node { id firstName lastName address1 address2 zip phoneNumber } }
    }
  }
}`

const mockDefaults: FormValues = {
  name: '홍길동', phone: '010-1234-5678',
  zipcode: '12265', address: '경기도 남양주시 다산순환로 20', addressDetail: '10층', zoneCode: 'KR-41',
}

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const isDev = process.env.NODE_ENV === 'development'
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  let defaultValues: Partial<FormValues> = isDev ? mockDefaults : {}
  // gid 타입(CustomerAddress vs MailingAddress)을 가정하지 않고 숫자 id로 매칭하고,
  // 저장에도 조립한 gid가 아닌 실제 gid를 사용한다.
  let addressGid = `gid://shopify/CustomerAddress/${id}`
  if (!isDev && token) {
    const data = await caQuery<{ customer: { addresses: { edges: { node: AddressNode }[] } } }>(token, QUERY)
    const found = data?.customer?.addresses?.edges?.find((e) => gidToId(e.node.id) === id)?.node
    if (found) {
      addressGid = found.id
      defaultValues = {
        name: `${found.lastName ?? ''}${found.firstName ?? ''}`.trim(),
        phone: found.phoneNumber ?? '',
        zipcode: found.zip ?? '',
        address: found.address1 ?? '',
        addressDetail: found.address2 ?? '',
      }
    }
  }

  const title = lang === 'ko' ? '배송지 수정' : lang === 'ja' ? '配送先を編集' : 'Edit address'

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-6">{title}</p>
      <AddressForm
        lang={lang}
        defaultValues={defaultValues}
        onSubmit={updateAddress.bind(null, addressGid)}
      />
    </div>
  )
}
