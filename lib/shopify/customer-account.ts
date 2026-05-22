const SHOP_ID = '78709162212'
const API_VERSION = process.env.SHOPIFY_STOREFRONT_API_VERSION ?? '2026-04'
export const CA_ENDPOINT = `https://shopify.com/${SHOP_ID}/account/customer/api/${API_VERSION}/graphql`

export async function caQuery<T = unknown>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> {
  const res = await fetch(CA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = await res.json()
  return json?.data ?? null
}

export function gidToId(gid: string): string {
  return gid.split('/').pop() ?? gid
}
