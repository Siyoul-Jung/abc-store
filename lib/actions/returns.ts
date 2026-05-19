'use server'

import { adminGql } from '@/lib/shopify/admin'

export type OrderLineItem = {
  lineItemId: string
  fulfillmentLineItemId: string | null
  name: string
  quantity: number
  image: string | null
}

export type OrderData = {
  id: string
  name: string
  createdAt: string
  isFulfilled: boolean
  lineItems: OrderLineItem[]
}

const LOOKUP_ORDER_QUERY = `
  query($query: String!) {
    orders(first: 1, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          shippingAddress { name firstName lastName }
          customer { displayName firstName lastName }
          lineItems(first: 20) {
            edges {
              node {
                id
                name
                quantity
                image { url }
              }
            }
          }
          fulfillments {
            fulfillmentLineItems(first: 20) {
              edges {
                node {
                  id
                  quantity
                  lineItem { id }
                }
              }
            }
          }
        }
      }
    }
  }
`

const RETURN_CREATE_MUTATION = `
  mutation($returnInput: ReturnInput!) {
    returnCreate(returnInput: $returnInput) {
      return {
        id
        status
        order { name }
      }
      userErrors { field message }
    }
  }
`

export async function lookupOrder(
  orderNumber: string,
  customerName: string,
): Promise<{ order: OrderData } | { error: string }> {
  const num = orderNumber.replace(/^#/, '').trim()
  const { data } = await adminGql(LOOKUP_ORDER_QUERY, { query: `name:#${num}` })

  const node = data?.orders?.edges?.[0]?.node
  if (!node) {
    console.error('[lookupOrder] not found. query:', `name:#${num}`, 'response:', JSON.stringify(data))
    return { error: 'ORDER_NOT_FOUND' }
  }

  const nameCandidates = [
    node.shippingAddress?.name,
    node.shippingAddress?.firstName,
    node.shippingAddress?.lastName,
    node.customer?.displayName,
    node.customer?.firstName,
    node.customer?.lastName,
  ].filter(Boolean).map((s: string) => s.toLowerCase())

  const inputName = customerName.trim().toLowerCase()
  const nameMatch = nameCandidates.length === 0 || nameCandidates.some(
    (n) => n.includes(inputName) || inputName.includes(n)
  )
  if (!nameMatch) return { error: 'NAME_MISMATCH' }

  // Build fulfillmentLineItemId map: lineItemId → fulfillmentLineItemId
  const fulfillmentMap = new Map<string, string>()
  for (const fulfillment of (node.fulfillments ?? [])) {
    for (const { node: fli } of (fulfillment.fulfillmentLineItems?.edges ?? [])) {
      fulfillmentMap.set(fli.lineItem.id, fli.id)
    }
  }

  const isFulfilled = fulfillmentMap.size > 0

  const lineItems: OrderLineItem[] = (node.lineItems?.edges ?? [])
    .map(({ node: li }: { node: { id: string; name: string; quantity: number; image: { url: string } | null } }) => ({
      lineItemId: li.id,
      fulfillmentLineItemId: fulfillmentMap.get(li.id) ?? null,
      name: li.name,
      quantity: li.quantity,
      image: li.image?.url ?? null,
    }))
    .filter((item: OrderLineItem) => item.fulfillmentLineItemId !== null)

  return {
    order: {
      id: node.id,
      name: node.name,
      createdAt: node.createdAt,
      isFulfilled,
      lineItems,
    },
  }
}

export type ReturnItem = {
  fulfillmentLineItemId: string
  quantity: number
}

export type ReturnRequestInput = {
  orderId: string
  type: 'return' | 'exchange'
  items: ReturnItem[]
  reason: string
  note: string
}

export async function submitReturnRequest(
  input: ReturnRequestInput,
): Promise<{ success: true; returnName: string } | { error: string }> {
  const customerNote = [
    input.type === 'exchange' ? '[교환 요청]' : null,
    input.note || null,
  ].filter(Boolean).join(' ')

  const returnInput = {
    orderId: input.orderId,
    notifyCustomer: true,
    returnLineItems: input.items.map((item) => ({
      fulfillmentLineItemId: item.fulfillmentLineItemId,
      quantity: item.quantity,
      returnReason: input.reason,
      customerNote: customerNote || undefined,
    })),
  }

  const { data } = await adminGql(RETURN_CREATE_MUTATION, { returnInput })
  const userErrors = data?.returnCreate?.userErrors

  if (userErrors?.length) return { error: userErrors[0].message }

  return {
    success: true,
    returnName: data?.returnCreate?.return?.order?.name ?? '',
  }
}
