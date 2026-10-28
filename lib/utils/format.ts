import type { Locale } from '@/lib/shopify/types'
import { fractionDigits } from './currency'

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function gidToNumericId(gid: string): string {
  return gid.split('/').at(-1) ?? gid
}

// "[KIDS] MILK SET-블루 해변" → "MILK SET-블루 해변"
export function stripTitlePrefix(title: string): string {
  return title.replace(/^\[[^\]]+\]\s*/, '')
}

export function formatPrice(amount: string, currencyCode: string, locale: Locale): string {
  const localeTag = locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : 'en-US'
  const digits = fractionDigits(currencyCode)
  const number = new Intl.NumberFormat(localeTag, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(amount))
  // 표기는 locale이 아니라 실제 통화 기준(Shopify Markets 통화). 자국어 관용 표기는 접미사(원/円/엔),
  // 그 외는 기호 접두 — Intl currency 스타일 금지 규칙 준수 위해 수동 매핑.
  if (currencyCode === 'KRW') return locale === 'ko' ? `${number}원` : `₩${number}`
  if (currencyCode === 'JPY') return locale === 'ja' ? `${number}円` : locale === 'ko' ? `${number}엔` : `¥${number}`
  if (currencyCode === 'USD') return `$${number}`
  return `${number} ${currencyCode}`
}
