import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { hasLocale } from '../../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery, gidToId } from '@/lib/shopify/customer-account'
import { deleteAddress, setDefaultAddress } from '@/lib/actions/account'

type Address = {
  id: string
  firstName: string; lastName: string
  address1: string; address2: string | null
  city: string; province: string | null; zip: string; country: string
  phone: string | null
}

type CustomerAddresses = {
  addresses: { edges: { node: Address }[] }
  defaultAddress: { id: string } | null
}

const QUERY = `{
  customer {
    addresses(first: 10) {
      edges { node { id firstName lastName address1 address2 city province zip country phone } }
    }
    defaultAddress { id }
  }
}`

const mockAddresses: CustomerAddresses = {
  addresses: {
    edges: [{ node: { id: 'gid://shopify/MailingAddress/1', firstName: '길동', lastName: '홍', address1: '다산순환로 20', address2: '10층', city: '남양주시', province: '경기도', zip: '12265', country: 'KR', phone: '010-1234-5678' } }]
  },
  defaultAddress: { id: 'gid://shopify/MailingAddress/1' },
}

const t: Record<Locale, { add: string; edit: string; delete: string; setDefault: string; default: string; empty: string }> = {
  ko: { add: '+ 배송지 추가', edit: '수정', delete: '삭제', setDefault: '기본 배송지로 설정', default: '기본', empty: '저장된 배송지가 없습니다.' },
  ja: { add: '+ 配送先を追加', edit: '編集', delete: '削除', setDefault: 'デフォルトに設定', default: 'デフォルト', empty: '保存された配送先はありません。' },
  en: { add: '+ Add address', edit: 'Edit', delete: 'Delete', setDefault: 'Set as default', default: 'Default', empty: 'No saved addresses.' },
}

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale

  const isDev = process.env.NODE_ENV === 'development'
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  let data: CustomerAddresses = isDev ? mockAddresses : { addresses: { edges: [] }, defaultAddress: null }
  if (!isDev && token) {
    const res = await caQuery<{ customer: CustomerAddresses }>(token, QUERY)
    if (res?.customer) data = res.customer
  }

  const labels = t[locale]
  const defaultId = data.defaultAddress?.id

  return (
    <div className="flex flex-col gap-6">

      {data.addresses.edges.length === 0 ? (
        <p className="text-sm text-ink-muted">{labels.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {data.addresses.edges.map(({ node: addr }) => {
            const isDefault = addr.id === defaultId
            return (
              <div key={addr.id} className={`p-4 border rounded-lg ${isDefault ? 'border-ink' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm leading-relaxed">
                    <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                    <p className="text-ink-muted">{addr.address1}{addr.address2 ? ` ${addr.address2}` : ''}</p>
                    <p className="text-ink-muted">{addr.city}{addr.province ? `, ${addr.province}` : ''} {addr.zip}</p>
                    {addr.phone && <p className="text-ink-muted">{addr.phone}</p>}
                  </div>
                  {isDefault && (
                    <span className="shrink-0 text-[10px] font-semibold tracking-wider uppercase border border-ink rounded-full px-2 py-0.5">
                      {labels.default}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                  <Link href={`/${lang}/account/addresses/${gidToId(addr.id)}/edit`}
                    className="text-xs text-ink-muted hover:text-ink transition-colors">
                    {labels.edit}
                  </Link>
                  <form action={async () => { 'use server'; await deleteAddress(addr.id) }}>
                    <button type="submit" className="text-xs text-ink-muted hover:text-ink transition-colors">
                      {labels.delete}
                    </button>
                  </form>
                  {!isDefault && (
                    <form action={async () => { 'use server'; await setDefaultAddress(addr.id) }}>
                      <button type="submit" className="text-xs text-ink-muted hover:text-ink transition-colors">
                        {labels.setDefault}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Link href={`/${lang}/account/addresses/new`}
        className="text-sm text-center py-3 border border-dashed border-border rounded-lg text-ink-muted hover:bg-surface hover:text-ink transition-colors">
        {labels.add}
      </Link>

    </div>
  )
}
