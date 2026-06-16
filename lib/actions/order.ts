'use server'

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!
const API_VERSION   = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'

function extractVariantId(gid: string): number {
  return Number(gid.split('/').pop())
}

// 같은 토스 주문ID로 이미 생성된 주문이 있는지 조회 (이중 호출 방어 — 멱등성).
// 주문은 `toss-{orderId}` 태그로 식별된다 (createShopifyOrder가 부여).
async function findOrderByTossId(tossOrderId: string): Promise<{ id: string; name: string } | null> {
  try {
    const res = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders.json?tag=toss-${tossOrderId}&status=any&fields=id,name`,
      { headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }, cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = await res.json()
    const o = data.orders?.[0]
    return o ? { id: String(o.id), name: o.name as string } : null
  } catch {
    return null
  }
}

export type ShippingData = {
  name: string
  phone: string
  email?: string
  zipcode: string
  address: string
  addressDetail: string
  memo: string
  paymentMethod?: 'card' | 'bank_transfer'
  shippingFee?: number
  surcharge?: number
  surchargeLabel?: string
  refundBank?: string
  refundAccountNum?: string
  refundHolder?: string
}

export async function createShopifyOrder(params: {
  orderId: string
  amount: number
  paymentKey: string
  shipping: ShippingData
  lineItems: { variantGid: string; quantity: number }[]
}): Promise<{ ok: boolean; shopifyOrderId?: string; shopifyOrderName?: string }> {
  const { orderId, amount, paymentKey, shipping, lineItems } = params
  const isBankTransfer = shipping.paymentMethod === 'bank_transfer'

  // 이중 호출 방어: 같은 토스 주문ID의 주문이 이미 있으면 재생성하지 않고 그대로 반환.
  // (confirm 라우트가 어쩌다 두 번 실행돼도 중복 주문이 생기지 않게.)
  const existing = await findOrderByTossId(orderId)
  if (existing) {
    return { ok: true, shopifyOrderId: existing.id, shopifyOrderName: existing.name }
  }

  const noteAttributes: { name: string; value: string }[] = [
    { name: 'toss_order_id',   value: orderId },
    { name: 'toss_payment_key', value: paymentKey },
  ]
  if (isBankTransfer) {
    if (shipping.refundBank)       noteAttributes.push({ name: 'refund_bank',    value: shipping.refundBank })
    if (shipping.refundAccountNum) noteAttributes.push({ name: 'refund_account', value: shipping.refundAccountNum })
    if (shipping.refundHolder)     noteAttributes.push({ name: 'refund_holder',  value: shipping.refundHolder })
  }

  // 배송비를 line_items가 아닌 shipping_lines로 분리.
  // → 주문총액 = 결제액 일치, 반품 시 환불 계산(배송비 별도 처리)이 정확해짐.
  const shippingLines: { title: string; price: string }[] = []
  if (typeof shipping.shippingFee === 'number') {
    shippingLines.push({
      title: shipping.shippingFee === 0 ? '무료배송' : '기본 배송비',
      price: String(shipping.shippingFee),
    })
  }
  if (shipping.surcharge && shipping.surcharge > 0) {
    shippingLines.push({
      title: shipping.surchargeLabel || '추가 배송비',
      price: String(shipping.surcharge),
    })
  }

  const body = {
    order: {
      line_items: lineItems.map((item) => ({
        variant_id: extractVariantId(item.variantGid),
        quantity: item.quantity,
      })),
      ...(shippingLines.length > 0 && { shipping_lines: shippingLines }),
      // 고객 이메일 — 주문확인 메일·환불완료 알림의 발송 주소.
      // API 생성 주문은 기본적으로 알림 메일을 안 보냄(send_receipt 미설정) —
      // Shopify 주문확인 메일은 한국어 템플릿 작업 후 활성화 예정 (launch-checklist 참조).
      ...(shipping.email && { email: shipping.email }),
      financial_status: isBankTransfer ? 'pending' : 'paid',
      fulfillment_status: null,
      // 재고 차감: REST orders.json 기본값은 'bypass'(차감 안 함)이므로 명시 필요.
      // 'decrement_obeying_policy' = 재고 차감하되, "품절 시에도 판매 계속" 설정은 존중.
      inventory_behaviour: 'decrement_obeying_policy',
      shipping_address: {
        first_name: shipping.name,
        phone: shipping.phone,
        address1: shipping.address,
        address2: shipping.addressDetail,
        zip: shipping.zipcode,
        city: '',
        country_code: 'KR',
      },
      note: shipping.memo || undefined,
      // toss-{orderId} 태그: 웹훅에서 주문 검색에 사용
      tags: `toss-payments,toss-${orderId}`,
      transactions: isBankTransfer ? [] : [
        {
          kind: 'sale',
          status: 'success',
          amount: String(amount),
          gateway: 'toss-payments',
          authorization: paymentKey,
        },
      ],
      note_attributes: noteAttributes,
    },
  }

  try {
    const res = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    )

    if (!res.ok) {
      console.error('[createShopifyOrder] failed:', await res.text())
      return { ok: false }
    }

    const data = await res.json()
    return {
      ok: true,
      shopifyOrderId: String(data.order.id),
      shopifyOrderName: data.order.name,  // '#1001' 형식
    }
  } catch (e) {
    console.error('[createShopifyOrder] error:', e)
    return { ok: false }
  }
}

export async function markShopifyOrderPaid(tossOrderId: string, amount: number, paymentKey: string) {
  // 1. 태그로 주문 검색 (CAPI용 고객/상품 정보 포함)
  const searchRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders.json?tag=toss-${tossOrderId}&status=any&fields=id,name,email,phone,shipping_address,line_items`,
    {
      headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN },
      cache: 'no-store',
    }
  )
  const searchData = await searchRes.json()
  const order = searchData.orders?.[0]
  if (!order) {
    console.error('[markShopifyOrderPaid] order not found for tossOrderId:', tossOrderId)
    return { ok: false }
  }

  // 2. 결제 트랜잭션 추가 → financial_status: paid 로 전환
  const txRes = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/orders/${order.id}/transactions.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        transaction: {
          kind: 'sale',
          status: 'success',
          amount: String(amount),
          gateway: 'toss-vbank',
          authorization: paymentKey,
        },
      }),
      cache: 'no-store',
    }
  )

  if (!txRes.ok) {
    console.error('[markShopifyOrderPaid] transaction failed:', await txRes.text())
    return { ok: false }
  }

  return {
    ok: true,
    shopifyOrderName: order.name as string,
    capiData: {
      email: order.email as string | undefined,
      phone: order.phone as string | undefined,
      firstName: order.shipping_address?.first_name as string | undefined,
      zipcode: order.shipping_address?.zip as string | undefined,
      contents: (order.line_items as { variant_id: number; quantity: number; price: string }[]).map((item) => ({
        id: String(item.variant_id),
        quantity: item.quantity,
        item_price: Number(item.price),
      })),
    },
  }
}
