// 통화 단일 출처 — 결제 통화는 locale이 아니라 Shopify 카트 통화(cart.cost.*.currencyCode)를 따른다.
// Shopify Markets에서 국가별 통화를 켜면 카트 통화가 바뀌고, 결제·검증·키 선택이 그대로 따라온다.

export type Currency = 'KRW' | 'JPY' | 'USD'

// 통화별 소수 자리수 — KRW·JPY는 정수, USD는 센트(2자리). 토스 금액도 이 자리수를 따른다.
const FRACTION_DIGITS: Record<Currency, number> = { KRW: 0, JPY: 0, USD: 2 }

export function isCurrency(code: string): code is Currency {
  return code in FRACTION_DIGITS
}

export function fractionDigits(currency: string): number {
  return isCurrency(currency) ? FRACTION_DIGITS[currency] : 2
}

// 최소 단위(원·엔·센트) 정수로 변환. 부동소수 합산 오차(12.1 + 3.2 ≠ 15.3) 없이 금액을 비교·합산하기 위함.
export function toMinor(amount: number, currency: string): number {
  return Math.round(amount * 10 ** fractionDigits(currency))
}

export function fromMinor(minor: number, currency: string): number {
  return minor / 10 ** fractionDigits(currency)
}

// 금액 합산 — 최소 단위로 더한 뒤 되돌려 소수 오차를 없앤다.
export function addMoney(currency: string, ...amounts: number[]): number {
  return fromMinor(amounts.reduce((sum, a) => sum + toMinor(a, currency), 0), currency)
}

export function sameAmount(a: number, b: number, currency: string): boolean {
  return toMinor(a, currency) === toMinor(b, currency)
}
