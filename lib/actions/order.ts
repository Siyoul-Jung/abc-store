'use server'

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN!
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN!
const API_VERSION   = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'

function extractVariantId(gid: string): number {
  return Number(gid.split('/').pop())
}

export type ShippingData = {
  name: string
  phone: string
  zipcode: string
  address: string
  addressDetail: string
  memo: string
  paymentMethod?: 'card' | 'bank_transfer'
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

  const noteAttributes: { name: string; value: string }[] = [
    { name: 'toss_order_id',   value: orderId },
    { name: 'toss_payment_key', value: paymentKey },
  ]
  if (isBankTransfer) {
    if (shipping.refundBank)       noteAttributes.push({ name: 'refund_bank',    value: shipping.refundBank })
    if (shipping.refundAccountNum) noteAttributes.push({ name: 'refund_account', value: shipping.refundAccountNum })
    if (shipping.refundHolder)     noteAttributes.push({ name: 'refund_holder',  value: shipping.refundHolder })
  }

  const body = {
    order: {
      line_items: lineItems.map((item) => ({
        variant_id: extractVariantId(item.variantGid),
        quantity: item.quantity,
      })),
      financial_status: isBankTransfer ? 'pending' : 'paid',
      fulfillment_status: null,
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
