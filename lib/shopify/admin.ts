export async function adminGql<T = any>(query: string, variables?: Record<string, unknown>): Promise<{ data: T }> {
  const res = await fetch(
    `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION ?? '2026-04'}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
      cache: 'no-store',
    },
  )
  const json = await res.json()
  if (!res.ok || json.errors) {
    console.error('[adminGql] error:', res.status, JSON.stringify(json.errors ?? json))
  }
  return json
}
