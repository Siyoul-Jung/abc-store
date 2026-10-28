import type { Currency } from '@/lib/utils/currency'

// 서버 전용 — 토스 시크릿 키(통화별 MID). 승인·취소는 결제한 MID의 키로만 가능하다.
const SECRET_KEYS: Record<Currency, string | undefined> = {
  KRW: process.env.TOSS_SECRET_KEY,
  JPY: process.env.TOSS_SECRET_KEY_JPY,
  USD: process.env.TOSS_SECRET_KEY_USD,
}

// 토스 API Basic 인증 헤더. 해당 통화 키가 없으면 null(계약 전 통화).
export function tossAuthHeader(currency: string = 'KRW'): string | null {
  const key = SECRET_KEYS[currency as Currency]
  return key ? 'Basic ' + Buffer.from(`${key}:`).toString('base64') : null
}
