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
}

export async function createShopifyOrder(params: {
  orderId: string
  amount: number
  paymentKey: string
  shipping: ShippingData
  lineItems: { variantGid: string; quantity: number }[]
}): Promise<{ ok: boolean; shopifyOrderId?: string }> {
  const { orderId, amount, paymentKey, shipping, lineItems } = params

  const body = {
    order: {
      line_items: lineItems.map((item) => ({
        variant_id: extractVariantId(item.variantGid),
        quantity: item.quantity,
      })),
      financial_status: 'paid',
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
      tags: 'toss-payments',
      transactions: [
        {
          kind: 'sale',
          status: 'success',
          amount: String(amount),
          gateway: 'toss-payments',
          authorization: paymentKey,
        },
      ],
      note_attributes: [
        { name: 'toss_order_id', value: orderId },
        { name: 'toss_payment_key', value: paymentKey },
      ],
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
      const err = await res.text()
      console.error('[createShopifyOrder] failed:', err)
      return { ok: false }
    }

    const data = await res.json()
    return { ok: true, shopifyOrderId: String(data.order.id) }
  } catch (e) {
    console.error('[createShopifyOrder] error:', e)
    return { ok: false }
  }
}
