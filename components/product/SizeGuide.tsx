'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/shopify/types'

const t = {
  ko: {
    title: '사이즈 가이드',
    size: '사이즈', age: '나이', standard: '호수', height: '키', weight: '몸무게',
    measurementBtn: '의류 실측 보기',
    topLength: '총장', chest: '가슴둘레', shoulder: '어깨넓이',
    sleeve: '소매기장', neckDepth: '목 깊이',
    bottomLength: '총기장', waist: '허리', thigh: '허벅지',
    unit: '(단위 cm)',
    note: '통상적인 연령별 사이즈입니다. 자주 입으셨던 옷과 실측 비교 후 구매하시는 게 가장 정확합니다.',
  },
  ja: {
    title: 'サイズガイド',
    size: 'サイズ', age: '年齢', standard: '号数', height: '身長', weight: '体重',
    measurementBtn: '実寸を見る',
    topLength: '総丈', chest: 'バスト', shoulder: '肩幅',
    sleeve: '袖丈', neckDepth: '衿深さ',
    bottomLength: '股上', waist: 'ウエスト', thigh: '太もも',
    unit: '(単位 cm)',
    note: '一般的な年齢別サイズです。普段お着せのお洋服の実寸と比較してご購入ください。',
  },
  en: {
    title: 'Size Guide',
    size: 'Size', age: 'Age', standard: 'Label', height: 'Height', weight: 'Weight',
    measurementBtn: 'View Measurements',
    topLength: 'Length', chest: 'Chest', shoulder: 'Shoulder',
    sleeve: 'Sleeve', neckDepth: 'Neck Depth',
    bottomLength: 'Length', waist: 'Waist', thigh: 'Thigh',
    unit: '(unit: cm)',
    note: 'These are standard sizes by age. We recommend comparing with the measurements of clothes your child currently wears for the best fit.',
  },
}

const bodySizes = [
  { label: 'XS',  age: { ko: '1~2세', ja: '1~2歳', en: '1–2 yrs' }, standard: '80호',  height: '80cm',  weight: '11kg' },
  { label: 'S',   age: { ko: '2~3세', ja: '2~3歳', en: '2–3 yrs' }, standard: '85호',  height: '85cm',  weight: '12kg' },
  { label: 'M',   age: { ko: '3~4세', ja: '3~4歳', en: '3–4 yrs' }, standard: '90호',  height: '90cm',  weight: '13kg' },
  { label: 'L',   age: { ko: '4~5세', ja: '4~5歳', en: '4–5 yrs' }, standard: '100호', height: '100cm', weight: '16kg' },
  { label: 'XL',  age: { ko: '5~6세', ja: '5~6歳', en: '5–6 yrs' }, standard: '110호', height: '110cm', weight: '20kg' },
  { label: '2XL', age: { ko: '6~7세', ja: '6~7歳', en: '6–7 yrs' }, standard: '120호', height: '120cm', weight: '22kg' },
  { label: '3XL', age: { ko: '7~8세', ja: '7~8歳', en: '7–8 yrs' }, standard: '130호', height: '130cm', weight: '25kg' },
]

const topMeasurements = [
  { label: 'XS',  topLength: 38.7, chest: 66.2, shoulder: 33.4, sleeve: 6.4,  neckDepth: 6.9 },
  { label: 'S',   topLength: 40.7, chest: 69.4, shoulder: 35,   sleeve: 7.1,  neckDepth: 7.2 },
  { label: 'M',   topLength: 42.7, chest: 72.6, shoulder: 36.6, sleeve: 7.8,  neckDepth: 7.5 },
  { label: 'L',   topLength: 44.7, chest: 75.8, shoulder: 38.2, sleeve: 8.5,  neckDepth: 7.8 },
  { label: 'XL',  topLength: 46.7, chest: 79,   shoulder: 39.8, sleeve: 9.2,  neckDepth: 8.1 },
  { label: '2XL', topLength: 48.7, chest: 82.2, shoulder: 41.4, sleeve: 9.9,  neckDepth: 8.4 },
  { label: '3XL', topLength: 50.7, chest: 85.4, shoulder: 43,   sleeve: 10.6, neckDepth: 8.7 },
]

const bottomMeasurements = [
  { label: 'XS',  bottomLength: 27.5, waist: 19, thigh: 15 },
  { label: 'S',   bottomLength: 30,   waist: 20, thigh: 16 },
  { label: 'M',   bottomLength: 32.5, waist: 21, thigh: 17 },
  { label: 'L',   bottomLength: 35,   waist: 22, thigh: 18 },
  { label: 'XL',  bottomLength: 37.5, waist: 23, thigh: 19 },
  { label: '2XL', bottomLength: 40,   waist: 24, thigh: 20 },
  { label: '3XL', bottomLength: 42.5, waist: 25, thigh: 21 },
]

type Props = { locale: Locale; hideHeader?: boolean }

export default function SizeGuide({ locale, hideHeader }: Props) {
  const [open, setOpen] = useState(false)
  const l = t[locale]

  return (
    <div id="size-guide" className={hideHeader ? '' : 'pt-10 border-t border-border'}>
      {!hideHeader && <h2 className="text-sm font-bold tracking-widest uppercase mb-6">{l.title}</h2>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center border-collapse min-w-[300px]">
          <thead>
            <tr className="border-b border-border">
              {[l.size, l.age, l.standard, l.height, l.weight].map((h) => (
                <th key={h} className="py-3 font-medium text-ink-muted whitespace-nowrap px-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodySizes.map((s) => (
              <tr key={s.label} className="border-b border-border last:border-0">
                <td className="py-3 font-semibold">{s.label}</td>
                <td className="py-3 text-ink-muted">{s.age[locale]}</td>
                <td className="py-3 text-ink-muted">{s.standard}</td>
                <td className="py-3 text-ink-muted">{s.height}</td>
                <td className="py-3 text-ink-muted">{s.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 border-t border-border">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-4 text-sm font-medium text-left"
        >
          {l.measurementBtn}
          <span className="text-ink-muted text-lg leading-none">{open ? '−' : '+'}</span>
        </button>

        {open && (
          <div className="pb-6 flex flex-col gap-8">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">TOP {l.unit}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse min-w-[400px]">
                  <thead>
                    <tr className="border-b border-border">
                      {[l.size, l.topLength, l.chest, l.shoulder, l.sleeve, l.neckDepth].map((h) => (
                        <th key={h} className="py-3 font-medium text-ink-muted whitespace-nowrap px-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topMeasurements.map((s) => (
                      <tr key={s.label} className="border-b border-border last:border-0">
                        <td className="py-3 font-semibold">{s.label}</td>
                        <td className="py-3 text-ink-muted">{s.topLength}</td>
                        <td className="py-3 text-ink-muted">{s.chest}</td>
                        <td className="py-3 text-ink-muted">{s.shoulder}</td>
                        <td className="py-3 text-ink-muted">{s.sleeve}</td>
                        <td className="py-3 text-ink-muted">{s.neckDepth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">BOTTOM {l.unit}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse min-w-[320px]">
                  <thead>
                    <tr className="border-b border-border">
                      {[l.size, l.bottomLength, l.waist, l.thigh].map((h) => (
                        <th key={h} className="py-3 font-medium text-ink-muted whitespace-nowrap px-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bottomMeasurements.map((s) => (
                      <tr key={s.label} className="border-b border-border last:border-0">
                        <td className="py-3 font-semibold">{s.label}</td>
                        <td className="py-3 text-ink-muted">{s.bottomLength}</td>
                        <td className="py-3 text-ink-muted">{s.waist}</td>
                        <td className="py-3 text-ink-muted">{s.thigh}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-ink-muted">{l.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
