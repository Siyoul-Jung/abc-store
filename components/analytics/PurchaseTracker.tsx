'use client'

import { useEffect, useRef } from 'react'
import { trackPixel } from '@/lib/analytics/pixel'

// 결제 완료 페이지에서 브라우저 Purchase 발화 — 서버 CAPI와 동일 eventId로 dedup.
// 서버가 Purchase를 보낸 주문(비가상계좌·주문생성 성공)에서만 마운트된다.
// StrictMode 이중 마운트 방지를 위해 ref 가드.
export default function PurchaseTracker({
  eventId,
  value,
  currency,
  contentIds,
}: {
  eventId: string
  value: number
  currency: string
  contentIds: string[]
}) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackPixel(
      'Purchase',
      {
        value,
        currency,
        content_ids: contentIds,
        content_type: 'product',
        num_items: contentIds.length,
      },
      eventId,
    )
  }, [eventId, value, currency, contentIds])

  return null
}
