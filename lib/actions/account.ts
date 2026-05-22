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
