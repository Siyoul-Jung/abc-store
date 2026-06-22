'use client'

import type { Locale } from '@/lib/shopify/types'

const t = {
  ko: {
    title: '사이즈 가이드',
    size: '사이즈', age: '나이', standard: '호수', height: '키', weight: '몸무게',
    note: '통상적인 연령별 사이즈입니다. 상세 치수는 상품 상세 이미지의 사이즈표를 참고해 주세요.',
  },
  ja: {
    title: 'サイズガイド',
    size: 'サイズ', age: '年齢', standard: '号数', height: '身長', weight: '体重',
    note: '一般的な年齢別サイズです。詳細な寸法は商品詳細画像のサイズ表をご参照ください。',
  },
  en: {
    title: 'Size Guide',
    size: 'Size', age: 'Age', standard: 'Label', height: 'Height', weight: 'Weight',
    note: 'These are standard sizes by age. For detailed measurements, please refer to the size chart in the product images.',
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

type Props = { locale: Locale; hideHeader?: boolean }

export default function SizeGuide({ locale, hideHeader }: Props) {
  const l = t[locale]

  return (
    <div id="size-guide" className={hideHeader ? '' : 'pt-10 border-t border-border'}>
      {!hideHeader && <h2 className="text-sm font-bold tracking-widest uppercase mb-6 break-keep">{l.title}</h2>}

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

      <p className="mt-4 text-xs text-ink-muted leading-relaxed">{l.note}</p>
    </div>
  )
}
