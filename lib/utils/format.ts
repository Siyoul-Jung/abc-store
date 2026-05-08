import type { Locale } from '@/lib/shopify/types'

export function gidToNumericId(gid: string): string {
  return gid.split('/').at(-1) ?? gid
}

export function formatPrice(amount: string, currencyCode: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : 'ja-JP', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount))
}
