import { NextRequest, NextResponse } from 'next/server'
import { markShopifyOrderPaid } from '@/lib/actions/order'
import { sendCAPIEvent } from '@/lib/meta-capi'

export async function POST(req: NextRequest) {
  const body = await req.text()

  // TODO: Toss 웹훅 서명 검증 (TOSS_WEBHOOK_SECRET 환경변수 등록 후 활성화)
  // const signature = req.headers.get('toss-signature')
  // const expected = crypto.createHmac('sha256', process.env.TOSS_WEBHOOK_SECRET!).update(body).digest('base64')
  // if (signature !== expected) return new NextResponse('Unauthorized', { status: 401 })

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
      eventSourceUrl: 'https://applebuttercollege.com/ko/checkout/success',
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
