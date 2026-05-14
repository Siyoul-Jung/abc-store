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
  const number = new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : 'ja-JP', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount))
  const suffix = locale === 'ko' ? '원' : '엔'
  return `${number}${suffix}`
}
