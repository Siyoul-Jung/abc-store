import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { markShopifyOrderPaid } from '@/lib/actions/order'
import { sendCAPIEvent } from '@/lib/meta-capi'

// 토스 웹훅 서명 검증.
// 토스가 보낸 진짜 웹훅인지 확인 — 위조된 입금신호로 미결제 주문이 paid 전환되는 것을 차단한다.
// 보안 키(TOSS_WEBHOOK_SECRET)는 토스 상점관리자 > 지급대행 설정에서 발급받는 값이며,
// 결제 API용 TOSS_SECRET_KEY 와는 별개다.
// 검증식: HMAC-SHA256(`{원문 payload}:{전송시각}`, 보안키) == 헤더 v1: 뒤 두 해시 중 하나
//   (해시가 2개인 이유: 보안 키 무중단 교체(rotation) 대비)
function verifyTossWebhook(rawBody: string, req: NextRequest): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET
  if (!secret) {
    // 보안 키 미설정 = 위조 방지 불가 → 거부(fail-closed). 운영 전 반드시 등록할 것.
    console.error('[toss-webhook] TOSS_WEBHOOK_SECRET 미설정 — 웹훅 거부')
    return false
  }

  const transmissionTime = req.headers.get('tosspayments-webhook-transmission-time')
  const signatureHeader = req.headers.get('tosspayments-webhook-signature')
  if (!transmissionTime || !signatureHeader) return false

  const message = `${rawBody}:${transmissionTime}`
  const expected = crypto.createHmac('sha256', secret).update(message).digest('base64')
  const candidates = signatureHeader.replace(/^v1:/, '').split(':')

  // 타이밍 공격 방지를 위해 timingSafeEqual 사용 (길이 다르면 즉시 불일치)
  const expectedBuf = Buffer.from(expected)
  return candidates.some((value) => {
    const valueBuf = Buffer.from(value)
    return valueBuf.length === expectedBuf.length && crypto.timingSafeEqual(valueBuf, expectedBuf)
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  if (!verifyTossWebhook(body, req)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  let payload: { eventType: string; data: { paymentKey: string; orderId: string; status: string; totalAmount?: number } }
  try {
    payload = JSON.parse(body)
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // 가상계좌 입금 완료 이벤트
  if (payload.eventType === 'VIRTUAL_ACCOUNT.DONE') {
    const { orderId, paymentKey, totalAmount } = payload.data
    const amount = totalAmount ?? 0

    const result = await markShopifyOrderPaid(orderId, amount, paymentKey)
    if (!result.ok) {
      console.error('[toss-webhook] markShopifyOrderPaid failed for orderId:', orderId)
      return new NextResponse('Internal Server Error', { status: 500 })
    }

    const { capiData } = result
    sendCAPIEvent({
      eventName: 'Purchase',
      eventSourceUrl: 'https://applebuttercollege.com/ko/checkout/complete',
      value: amount,
      currency: 'KRW',
      orderId,
      contents: capiData?.contents ?? [],
      userData: {
        email: capiData?.email,
        phone: capiData?.phone,
        firstName: capiData?.firstName,
        zipcode: capiData?.zipcode,
      },
    }).catch(() => {})
  }

  return new NextResponse('OK', { status: 200 })
}
