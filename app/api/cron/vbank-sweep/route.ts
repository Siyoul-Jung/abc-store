import { NextResponse, type NextRequest } from 'next/server'
import { adminGql } from '@/lib/shopify/admin'

// 가상계좌(무통장) 미입금 만료 스윕.
// 토스는 가상계좌 '입금 마감 경과' 시 웹훅을 보내지 않는다(상태 변화 이벤트가 없음).
// 주문 생성 시 재고를 차감했으므로(inventory_behaviour),
// 미입금 채로 방치되면 재고가 영원히 묶인다 → 주기적으로 만료분을 취소+재고복원한다.
//
// Vercel Cron이 호출. CRON_SECRET이 설정돼 있으면 Authorization 헤더로 인증한다.

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!
const API_VERSION   = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'

type AdminPendingOrder = {
  id: number
  name: string
  note_attributes: { name: string; value: string }[]
}

// 토스 결제 상태 조회 — 입금 여부(DONE)를 확인해 레이스(입금 직후 웹훅 전 스윕) 방지.
async function getTossStatus(paymentKey: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
      headers: { Authorization: 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY! + ':').toString('base64') },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.status as string) ?? null
  } catch {
    return null
  }
}

// 만료된 가상계좌를 토스에서 무효화(아직 WAITING이면). 이미 만료/취소면 토스가 정리했으므로 무시.
async function voidTossVbank(paymentKey: string) {
  try {
    await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY! + ':').toString('base64'),
      },
      body: JSON.stringify({ cancelReason: '가상계좌 입금기한 만료' }),
    })
  } catch {
    /* 이미 만료/취소된 결제는 토스가 거부할 수 있음 — 무시하고 Shopify 취소로 진행 */
  }
}

async function cancelShopifyOrder(orderId: number): Promise<boolean> {
  // refund:false (입금 전이라 환불할 금액 없음), restock:true (차감했던 재고 복원).
  const { data } = await adminGql(
    `mutation CancelExpired($orderId: ID!) {
      orderCancel(orderId: $orderId, reason: OTHER, refund: false, restock: true, notifyCustomer: true) {
        job { id }
        orderCancelUserErrors { message }
      }
    }`,
    { orderId: `gid://shopify/Order/${orderId}` }
  )
  const errors = data?.orderCancel?.orderCancelUserErrors
  if (errors?.length) {
    console.error('[vbank-sweep] orderCancel error:', orderId, errors[0].message)
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  // 인증: CRON_SECRET이 설정돼 있으면 반드시 일치해야 함(외부 임의 호출 차단).
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  // 입금 대기(financial_status=pending) + 미발송(open) 주문만 조회.
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders.json?status=open&financial_status=pending&fields=id,name,note_attributes&limit=250`,
    { headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }, cache: 'no-store' }
  )
  if (!res.ok) {
    console.error('[vbank-sweep] order fetch failed:', await res.text().catch(() => ''))
    return NextResponse.json({ error: 'order_fetch_failed' }, { status: 502 })
  }

  const { orders } = (await res.json()) as { orders: AdminPendingOrder[] }
  const now = Date.now()
  const cancelled: string[] = []
  const skipped: { name: string; reason: string }[] = []

  for (const o of orders ?? []) {
    const attrs = o.note_attributes ?? []
    const get = (k: string) => attrs.find((a) => a.name === k)?.value ?? null
    const due = get('vbank_due_date')
    const paymentKey = get('toss_payment_key')

    // 가상계좌가 아니거나(마감일 없음) 마감 전이면 건너뜀.
    if (!due || !paymentKey) { skipped.push({ name: o.name, reason: 'not_vbank' }); continue }
    if (now <= Date.parse(due)) { skipped.push({ name: o.name, reason: 'not_yet_due' }); continue }

    // 레이스 방지: 토스에서 실제 입금완료(DONE)면 취소하지 않고 웹훅 처리에 맡긴다.
    const status = await getTossStatus(paymentKey)
    if (status === 'DONE') { skipped.push({ name: o.name, reason: 'deposited' }); continue }

    if (status === 'WAITING_FOR_DEPOSIT') await voidTossVbank(paymentKey)
    const ok = await cancelShopifyOrder(o.id)
    if (ok) cancelled.push(o.name)
    else skipped.push({ name: o.name, reason: 'cancel_failed' })
  }

  return NextResponse.json({ ok: true, scanned: orders?.length ?? 0, cancelled, skipped })
}
