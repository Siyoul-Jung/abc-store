// 배송비 계산 — 클라이언트(CheckoutForm)와 서버(결제 confirm 라우트)의 단일 출처.
// 두 곳이 서로 다른 상수/규칙을 쓰면 서버 금액검증이 정상 주문을 오검출하므로 반드시 여기서만 관리한다.

export const SHIPPING_THRESHOLD = 80000 // 이 금액 이상 구매 시 기본 배송비 무료
export const SHIPPING_FEE = 3500
export const JEJU_SURCHARGE = 3000
export const ISLAND_SURCHARGE = 4000

// 제주 우편번호(63xxx) 판정 — 5자리이고 63으로 시작.
export function isJejuZip(zipcode: string): boolean {
  return zipcode.length === 5 && zipcode.startsWith('63')
}

export type ShippingCalc = { shippingFee: number; surcharge: number; surchargeLabel: string }

// 배송 규칙이 정해진 통화(=마켓). 해외 배송비·관세 정책이 확정되면 여기에 규칙을 추가한다.
export function isShippingSupported(currency: string): boolean {
  return currency === 'KRW'
}

// 소계·우편번호·도서산간 여부로 배송비/추가배송비를 산출.
// 제주는 우편번호로 판정(서버 검증 가능)하며 도서·산간(사용자 체크박스)보다 우선한다.
// 규칙이 없는 통화면 null → 호출측은 결제를 막는다(배송비 0으로 결제되는 사고 방지).
export function calcShipping(
  subtotal: number,
  opts: { zipcode: string; isIsland: boolean; currency: string },
): ShippingCalc | null {
  if (!isShippingSupported(opts.currency)) return null
  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  if (isJejuZip(opts.zipcode)) {
    return { shippingFee, surcharge: JEJU_SURCHARGE, surchargeLabel: '제주 추가배송비' }
  }
  if (opts.isIsland) {
    return { shippingFee, surcharge: ISLAND_SURCHARGE, surchargeLabel: '도서·산간 추가배송비' }
  }
  return { shippingFee, surcharge: 0, surchargeLabel: '' }
}
