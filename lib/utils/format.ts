import type { Locale } from '@/lib/shopify/types'

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
  const number = new Intl.NumberFormat(localeTag, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount))
  // ko/ja는 접미사(원/엔). en은 통화코드 기반 기호 접두 — Intl currency 스타일 금지 규칙 준수 위해 수동 매핑.
  if (locale === 'ko') return `${number}원`
  if (locale === 'ja') return `${number}엔`
  const symbol = currencyCode === 'KRW' ? '₩' : currencyCode === 'JPY' ? '¥' : ''
  return symbol ? `${symbol}${number}` : `${number} ${currencyCode}`
}
