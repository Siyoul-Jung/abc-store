import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../../../../dictionaries'
import { caQuery } from '@/lib/shopify/customer-account'
import { updateAddress } from '@/lib/actions/account'
import AddressForm from '../../_components/AddressForm'

// 폼이 다루는 표시값 (저장 시 AddressForm이 CustomerAddressInput으로 변환)
type FormValues = {
  name: string; phone: string
  zipcode: string; address: string; addressDetail: string
}

type AddressNode = {
  id: string; firstName?: string; lastName?: string
  address1?: string; address2?: string; zip?: string; phoneNumber?: string
}

const QUERY = `{
  customer {
    addresses(first: 20) {
      edges { node { id firstName lastName address1 address2 zip phoneNumber } }
    }
  }
}`

const mockDefaults: FormValues = {
  name: '홍길동', phone: '010-1234-5678',
  zipcode: '12265', address: '경기도 남양주시 다산순환로 20', addressDetail: '10층',
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
  if (!isDev && token) {
    const gid = `gid://shopify/MailingAddress/${id}`
    const data = await caQuery<{ customer: { addresses: { edges: { node: AddressNode }[] } } }>(token, QUERY)
    const found = data?.customer?.addresses?.edges?.find(e => e.node.id === gid)?.node
    if (found) {
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
  const gid = `gid://shopify/MailingAddress/${id}`

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-6">{title}</p>
      <AddressForm
        lang={lang}
        defaultValues={defaultValues}
        onSubmit={updateAddress.bind(null, gid)}
      />
    </div>
  )
}
