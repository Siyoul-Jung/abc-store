'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { caQuery } from '@/lib/shopify/customer-account'
import { adminGql } from '@/lib/shopify/admin'

async function getToken() {
  const store = await cookies()
  return store.get('customer_token')?.value ?? null
}

export type AddressInput = {
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  province?: string
  zip: string
  country: string
  phone?: string
}

export async function createAddress(input: AddressInput) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  const data = await caQuery<{ customerAddressCreate: { userErrors: { message: string }[] } }>(
    token,
    `mutation CreateAddress($address: CustomerAddressInput!) {
      customerAddressCreate(address: $address) {
        customerAddress { id }
        userErrors { field message }
      }
    }`,
    { address: input }
  )
  const errors = data?.customerAddressCreate?.userErrors
  if (errors?.length) return { error: errors[0].message }
  revalidatePath('/[lang]/account/addresses', 'page')
  return { success: true }
}

export async function updateAddress(id: string, input: AddressInput) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  const data = await caQuery<{ customerAddressUpdate: { userErrors: { message: string }[] } }>(
    token,
    `mutation UpdateAddress($id: ID!, $address: CustomerAddressInput!) {
      customerAddressUpdate(addressId: $id, address: $address) {
        customerAddress { id }
        userErrors { field message }
      }
    }`,
    { id, address: input }
  )
  const errors = data?.customerAddressUpdate?.userErrors
  if (errors?.length) return { error: errors[0].message }
  revalidatePath('/[lang]/account/addresses', 'page')
  return { success: true }
}

export async function deleteAddress(id: string) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  await caQuery(
    token,
    `mutation DeleteAddress($id: ID!) {
      customerAddressDelete(addressId: $id) {
        deletedAddressId
        userErrors { field message }
      }
    }`,
    { id }
  )
  revalidatePath('/[lang]/account/addresses', 'page')
  return { success: true }
}

export async function cancelOrder(orderId: string) {
  const store = await cookies()
  if (!store.get('customer_token')?.value) return { error: 'unauthorized' }

  // Shopify Admin에서 결제 정보 조회 (Toss paymentKey, 환불 계좌 등)
  const numericId = orderId.split('/').pop()
  const orderRes = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'}/orders/${numericId}.json?fields=total_price,note_attributes`,
    { headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN! }, cache: 'no-store' }
  )
  if (orderRes.ok) {
    const { order: o } = await orderRes.json()
    const attrs: { name: string; value: string }[] = o?.note_attributes ?? []
    const get = (k: string) => attrs.find((a) => a.name === k)?.value ?? null
    const paymentKey = get('toss_payment_key')
    const totalPrice = Math.round(Number(o?.total_price ?? 0))

    if (paymentKey && totalPrice > 0) {
      const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY! + ':').toString('base64'),
        },
        body: JSON.stringify({ cancelReason: '고객 주문 취소', cancelAmount: totalPrice }),
      })
      if (!tossRes.ok) {
        const err = await tossRes.json().catch(() => ({}))
        return { error: (err as { message?: string }).message ?? 'Toss 결제 취소 실패' }
      }
    }
  }

  // Shopify 주문 취소
  const { data } = await adminGql(
    `mutation CancelOrder($orderId: ID!) {
      orderCancel(orderId: $orderId, reason: CUSTOMER, refund: true, restock: true, notifyCustomer: true) {
        job { id }
        orderCancelUserErrors { message }
      }
    }`,
    { orderId }
  )
  const errors = data?.orderCancel?.orderCancelUserErrors
  if (errors?.length) return { error: errors[0].message }

  revalidatePath('/[lang]/account/orders', 'page')
  return { success: true }
}

export async function setDefaultAddress(id: string) {
  const token = await getToken()
  if (!token) return { error: 'unauthorized' }

  await caQuery(
    token,
    `mutation SetDefault($id: ID!) {
      customerDefaultAddressUpdate(addressId: $id) {
        customer { defaultAddress { id } }
        userErrors { field message }
      }
    }`,
    { id }
  )
  revalidatePath('/[lang]/account/addresses', 'page')
  return { success: true }
}
