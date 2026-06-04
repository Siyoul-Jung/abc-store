'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AddressInput } from '@/lib/actions/account'

type Props = {
  lang: string
  defaultValues?: Partial<AddressInput>
  onSubmit: (input: AddressInput) => Promise<{ success?: boolean; error?: string }>
}

const labels = {
  ko: { firstName: '이름', lastName: '성', address1: '주소', address2: '상세주소 (선택)', city: '시/구', province: '도/특별시', zip: '우편번호', country: '국가', phone: '전화번호 (선택)', submit: '저장', cancel: '취소', saving: '저장 중...' },
  ja: { firstName: '名', lastName: '姓', address1: '住所', address2: '番地・建物名（任意）', city: '市区町村', province: '都道府県', zip: '郵便番号', country: '国', phone: '電話番号（任意）', submit: '保存', cancel: 'キャンセル', saving: '保存中...' },
  en: { firstName: 'First name', lastName: 'Last name', address1: 'Address', address2: 'Apt, suite (optional)', city: 'City', province: 'State / Province', zip: 'ZIP / Postal code', country: 'Country', phone: 'Phone (optional)', submit: 'Save', cancel: 'Cancel', saving: 'Saving...' },
}

export default function AddressForm({ lang, defaultValues = {}, onSubmit }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const locale = (lang as 'ko' | 'ja' | 'en') in labels ? lang as 'ko' | 'ja' | 'en' : 'ko'
  const t = labels[locale]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const input: AddressInput = {
      firstName: fd.get('firstName') as string,
      lastName: fd.get('lastName') as string,
      address1: fd.get('address1') as string,
      address2: fd.get('address2') as string || undefined,
      city: fd.get('city') as string,
      province: fd.get('province') as string || undefined,
      zip: fd.get('zip') as string,
      country: fd.get('country') as string,
      phone: fd.get('phone') as string || undefined,
    }
    startTransition(async () => {
      const res = await onSubmit(input)
      if (res.success) router.push(`/${lang}/account/addresses`)
    })
  }

  const field = (name: keyof AddressInput, label: string, required = true) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-ink-muted">{label}{required && ' *'}</label>
      <input
        name={name}
        defaultValue={defaultValues[name] ?? ''}
        required={required}
        className="border border-border rounded px-3 py-2 text-sm outline-none focus:border-ink transition-colors"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {field('firstName', t.firstName)}
        {field('lastName', t.lastName)}
      </div>
      {field('address1', t.address1)}
      {field('address2', t.address2, false)}
      <div className="grid grid-cols-2 gap-3">
        {field('city', t.city)}
        {field('zip', t.zip)}
      </div>
      {field('province', t.province, false)}
      {field('country', t.country)}
      {field('phone', t.phone, false)}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending}
          className="flex-1 py-2.5 bg-ink text-white text-sm rounded-full hover:opacity-80 transition-opacity disabled:opacity-50">
          {pending ? t.saving : t.submit}
        </button>
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-2.5 border border-border text-sm rounded-full hover:bg-surface transition-colors">
          {t.cancel}
        </button>
      </div>
    </form>
  )
}
