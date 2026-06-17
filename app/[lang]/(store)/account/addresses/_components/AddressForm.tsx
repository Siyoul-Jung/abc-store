'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import type { AddressInput } from '@/lib/actions/account'
import AddressSearchModal from '@/components/checkout/AddressSearchModal'

// 주소록 폼 — 체크아웃과 동일하게 다음(카카오) 우편번호 검색 방식.
// 한국 주소는 도로명주소 한 줄 + 우편번호 + 상세주소가 표준이라 시/도 분할 입력을 쓰지 않는다.

type FormValues = {
  name: string
  phone: string
  zipcode: string
  address: string
  addressDetail: string
  zoneCode: string // 다음 검색의 시·도에서 매핑 (CA API 필수) — 화면엔 노출 안 함
}

// 다음 검색이 주는 시·도 이름 → ISO 3166-2 지역 코드 (CA API zoneCode)
function sidoToZoneCode(sido: string): string {
  const s = sido ?? ''
  if (s.includes('서울')) return 'KR-11'
  if (s.includes('부산')) return 'KR-26'
  if (s.includes('대구')) return 'KR-27'
  if (s.includes('인천')) return 'KR-28'
  if (s.includes('광주')) return 'KR-29'
  if (s.includes('대전')) return 'KR-30'
  if (s.includes('울산')) return 'KR-31'
  if (s.includes('세종')) return 'KR-50'
  if (s.includes('경기')) return 'KR-41'
  if (s.includes('강원')) return 'KR-42'
  if (s.includes('충북') || s.includes('충청북')) return 'KR-43'
  if (s.includes('충남') || s.includes('충청남')) return 'KR-44'
  if (s.includes('전북') || s.includes('전라북')) return 'KR-45'
  if (s.includes('전남') || s.includes('전라남')) return 'KR-46'
  if (s.includes('경북') || s.includes('경상북')) return 'KR-47'
  if (s.includes('경남') || s.includes('경상남')) return 'KR-48'
  if (s.includes('제주')) return 'KR-49'
  return ''
}

type Props = {
  lang: string
  defaultValues?: Partial<FormValues>
  onSubmit: (input: AddressInput) => Promise<{ success?: boolean; error?: string }>
}

const labels = {
  ko: { name: '받는 분', phone: '전화번호', zipcode: '우편번호', search: '주소 검색', address: '주소', addressDetail: '상세주소 (선택)', submit: '저장', cancel: '취소', saving: '저장 중...', searchFail: '주소 검색을 불러오지 못했습니다. 직접 입력해 주세요.', required: '받는 분·전화·주소·우편번호(5자리)를 입력해 주세요.' },
  ja: { name: 'お届け先', phone: '電話番号', zipcode: '郵便番号', search: '住所検索', address: '住所', addressDetail: '建物名・部屋番号（任意）', submit: '保存', cancel: 'キャンセル', saving: '保存中...', searchFail: '住所検索を読み込めませんでした。直接入力してください。', required: 'お届け先・電話・住所・郵便番号（5桁）を入力してください。' },
  en: { name: 'Recipient', phone: 'Phone', zipcode: 'ZIP', search: 'Search', address: 'Address', addressDetail: 'Detail (optional)', submit: 'Save', cancel: 'Cancel', saving: 'Saving...', searchFail: 'Address search failed to load. Please enter manually.', required: 'Please enter recipient, phone, address, and a 5-digit ZIP.' },
}

export default function AddressForm({ lang, defaultValues = {}, onSubmit }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const locale = (lang as 'ko' | 'ja' | 'en') in labels ? (lang as 'ko' | 'ja' | 'en') : 'ko'
  const t = labels[locale]

  const [form, setForm] = useState<FormValues>({
    name: defaultValues.name ?? '',
    phone: defaultValues.phone ?? '',
    zipcode: defaultValues.zipcode ?? '',
    address: defaultValues.address ?? '',
    addressDetail: defaultValues.addressDetail ?? '',
    zoneCode: defaultValues.zoneCode ?? '',
  })
  const [daumReady, setDaumReady] = useState(false)
  const [daumFailed, setDaumFailed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'border border-border rounded px-3 py-2 text-sm outline-none focus:border-ink transition-colors'
  const up = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.name || !form.phone || !form.address || !/^\d{5}$/.test(form.zipcode)) {
      setError(t.required)
      return
    }
    setError('')
    // 단일 이름 필드를 firstName에 담는다(한국 표기). territoryCode는 KR 스토어 고정.
    const input: AddressInput = {
      firstName: form.name,
      address1: form.address,
      address2: form.addressDetail || undefined,
      zip: form.zipcode,
      phoneNumber: form.phone || undefined,
      territoryCode: 'KR',
      zoneCode: form.zoneCode,
    }
    startTransition(async () => {
      const res = await onSubmit(input)
      if (res.success) router.push(`/${lang}/account/addresses`)
      else setError(res.error ?? 'error')
    })
  }

  return (
    <>
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onReady={() => setDaumReady(true)}
        onError={() => setDaumFailed(true)}
      />
      {searchOpen && (
        <AddressSearchModal
          onSelect={(zipcode, address, sido) => {
            setForm((p) => ({ ...p, zipcode, address, zoneCode: sidoToZoneCode(sido) || p.zoneCode }))
            setSearchOpen(false)
          }}
          onClose={() => setSearchOpen(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">{t.name} *</label>
          <input className={inputCls} value={form.name} onChange={up('name')} autoComplete="name" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">{t.phone} *</label>
          <input className={inputCls} value={form.phone} onChange={up('phone')} inputMode="tel" autoComplete="tel" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">{t.zipcode} *</label>
          <div className="flex gap-2 items-center">
            <input
              className={`${inputCls} w-32 ${daumFailed ? '' : 'cursor-pointer bg-surface'}`}
              value={form.zipcode}
              autoComplete="postal-code"
              {...(daumFailed
                ? { onChange: up('zipcode'), inputMode: 'numeric' as const }
                : { readOnly: true, onClick: () => daumReady && setSearchOpen(true) })}
            />
            <button
              type="button"
              onClick={() => daumReady && setSearchOpen(true)}
              disabled={daumFailed}
              className="shrink-0 border border-ink text-ink text-sm px-4 py-2 rounded hover:bg-ink hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.search}
            </button>
          </div>
          {daumFailed && <p className="text-xs text-coral break-keep">{t.searchFail}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">{t.address} *</label>
          <input
            className={`${inputCls} ${daumFailed ? '' : 'cursor-pointer bg-surface'}`}
            value={form.address}
            autoComplete="address-line1"
            {...(daumFailed
              ? { onChange: up('address') }
              : { readOnly: true, onClick: () => daumReady && setSearchOpen(true) })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-muted">{t.addressDetail}</label>
          <input className={inputCls} value={form.addressDetail} onChange={up('addressDetail')} autoComplete="address-line2" />
        </div>

        {error && <p className="text-xs text-coral break-keep">{error}</p>}

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
    </>
  )
}
