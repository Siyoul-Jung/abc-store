// Meta 픽셀 클라이언트 헬퍼 — window.fbq 래핑. 서버/픽셀 미로드 시 안전하게 no-op.
// 브라우저 이벤트(PageView·ViewContent·AddToCart·Purchase)는 여기로만 발화한다.
// Purchase는 서버 CAPI와 dedup 위해 반드시 eventID(주문 기반)를 넘긴다.

type FbqParams = Record<string, unknown>

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackPixel(event: string, params?: FbqParams, eventID?: string): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  if (eventID) window.fbq('track', event, params ?? {}, { eventID })
  else window.fbq('track', event, params ?? {})
}
