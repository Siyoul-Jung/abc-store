import type { Currency } from './currency'

// 토스는 MID 1개 = 통화 1개. 통화별로 다른 MID의 클라이언트 키를 쓴다.
// NEXT_PUBLIC_* 는 빌드 시 리터럴 접근만 인라인되므로 동적 키 조회(process.env[name]) 금지.
const CLIENT_KEYS: Record<Currency, string | undefined> = {
  KRW: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  JPY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY_JPY,
  USD: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY_USD,
}

// 키가 없으면 그 통화는 아직 결제 불가(계약 전) → undefined.
export function getTossClientKey(currency: string): string | undefined {
  return CLIENT_KEYS[currency as Currency] || undefined
}
