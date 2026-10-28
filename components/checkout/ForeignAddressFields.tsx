'use client'

import { useState } from 'react'
import { JP_PREFECTURES, US_STATES } from '@/lib/utils/address'

export type AddressValues = {
  name: string; phone: string; zipcode: string
  province: string; city: string; address: string; addressDetail: string
}

type Props = {
  country: 'JP' | 'US'
  values: AddressValues
  onChange: (patch: Partial<AddressValues>) => void
  inputCls: string
}

// 해외 배송지 입력 — 국가별 주소 관례(필드 순서·라벨)를 따른다. 라벨은 그 나라 언어로 고정
// (배송 라벨에 그대로 찍히는 값이라 현지 표기가 정확해야 함). 한국은 CheckoutForm의 다음 우편번호 흐름.
export default function ForeignAddressFields({ country, values, onChange, inputCls }: Props) {
  const [lookupFailed, setLookupFailed] = useState(false)
  const set = (key: keyof AddressValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ [key]: e.target.value })

  // 일본 우편번호 7자리 입력 시 zipcloud로 도도부현·시구정촌·町域 자동 채움(무료, 키 불필요, CORS 허용).
  // 실패해도 직접 입력 가능 — 결제를 막지 않는다.
  async function lookupJpZip(raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits.length !== 7) return
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`)
      const data = (await res.json()) as {
        results: { address2: string; address3: string; prefcode: string }[] | null
      }
      const hit = data.results?.[0]
      if (!hit) { setLookupFailed(true); return }
      setLookupFailed(false)
      onChange({
        province: `JP-${hit.prefcode.padStart(2, '0')}`,
        city: hit.address2,
        address: hit.address3,
      })
    } catch {
      setLookupFailed(true)
    }
  }

  const selectCls = `${inputCls} bg-white`

  if (country === 'JP') {
    return (
      <>
        <input className={inputCls} placeholder="氏名" value={values.name} onChange={set('name')} autoComplete="name" />
        <input className={inputCls} placeholder="電話番号" value={values.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />
        <input
          className={`${inputCls} w-40`}
          placeholder="郵便番号 (例: 100-0001)"
          value={values.zipcode}
          onChange={(e) => { onChange({ zipcode: e.target.value }); lookupJpZip(e.target.value) }}
          inputMode="numeric"
          autoComplete="postal-code"
        />
        {lookupFailed && (
          <p className="text-xs text-ink-muted break-keep">郵便番号から住所を取得できませんでした。直接入力してください。</p>
        )}
        <select className={selectCls} value={values.province} onChange={set('province')} autoComplete="address-level1">
          <option value="">都道府県を選択</option>
          {JP_PREFECTURES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
        </select>
        <input className={inputCls} placeholder="市区町村" value={values.city} onChange={set('city')} autoComplete="address-level2" />
        <input className={inputCls} placeholder="町名・番地" value={values.address} onChange={set('address')} autoComplete="address-line1" />
        <input className={inputCls} placeholder="建物名・部屋番号" value={values.addressDetail} onChange={set('addressDetail')} autoComplete="address-line2" />
      </>
    )
  }

  return (
    <>
      <input className={inputCls} placeholder="Full name" value={values.name} onChange={set('name')} autoComplete="name" />
      <input className={inputCls} placeholder="Phone" value={values.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />
      <input className={inputCls} placeholder="Address" value={values.address} onChange={set('address')} autoComplete="address-line1" />
      <input className={inputCls} placeholder="Apt, suite, etc. (optional)" value={values.addressDetail} onChange={set('addressDetail')} autoComplete="address-line2" />
      <input className={inputCls} placeholder="City" value={values.city} onChange={set('city')} autoComplete="address-level2" />
      <div className="flex gap-2">
        <select className={`${selectCls} flex-1 min-w-0`} value={values.province} onChange={set('province')} autoComplete="address-level1">
          <option value="">State</option>
          {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
        </select>
        <input className={`${inputCls} w-32`} placeholder="ZIP code" value={values.zipcode} onChange={set('zipcode')} inputMode="numeric" autoComplete="postal-code" />
      </div>
    </>
  )
}
