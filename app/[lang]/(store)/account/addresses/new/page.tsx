import { notFound } from 'next/navigation'
import { hasLocale } from '../../../../dictionaries'
import { createAddress } from '@/lib/actions/account'
import AddressForm from '../_components/AddressForm'

export default async function NewAddressPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const title = lang === 'ko' ? '배송지 추가' : lang === 'ja' ? '配送先を追加' : 'Add address'

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-6">{title}</p>
      <AddressForm lang={lang} onSubmit={createAddress} />
    </div>
  )
}
