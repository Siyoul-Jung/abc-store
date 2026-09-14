'use client'

import { useEffect } from 'react'
import { trackPixel } from '@/lib/analytics/pixel'

// 상품상세 진입 시 ViewContent 발화 — 리타게팅 모수·전환최적화 학습용 상단퍼널 신호.
export default function ProductViewTracker({
  productId,
  value,
  currency,
}: {
  productId: string
  value: number
  currency: string
}) {
  useEffect(() => {
    trackPixel('ViewContent', {
      content_ids: [productId],
      content_type: 'product',
      value,
      currency,
    })
  }, [productId, value, currency])

  return null
}
