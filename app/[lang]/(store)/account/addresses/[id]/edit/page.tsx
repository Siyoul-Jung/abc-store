import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../../../../dictionaries'
import { caQuery } from '@/lib/shopify/customer-account'
import { updateAddress } from '@/lib/actions/account'
import type { AddressInput } from '@/lib/actions/account'
import AddressForm from '../../_components/AddressForm'

const QUERY = `
  query GetAddress($id: ID!) {
    customer {
      addresses(first: 10) {
        edges { node { id firstName lastName address1 address2 city province zip country phone } }
      }
    }
  }
`

const mockAddress: AddressInput = {
  firstName: '길동', lastName: '홍',
  address1: '다산순환로 20', address2: '10층',
  city: '남양주시', province: '경기도', zip: '12265', country: 'KR', phone: '010-1234-5678',
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

  let defaultValues: Partial<AddressInput> = isDev ? mockAddress : {}
  if (!isDev && token) {
    const gid = `gid://shopify/MailingAddress/${id}`
    const data = await caQuery<{ customer: { addresses: { edges: { node: AddressInput & { id: string } }[] } } }>(token, QUERY)
    const found = data?.customer?.addresses?.edges?.find(e => e.node.id === gid)?.node
    if (found) defaultValues = found
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
