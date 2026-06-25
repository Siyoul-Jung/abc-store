// 테스트 데이터 정리 — seed-test-data.mjs로 만든 것들을 되돌린다.
//  - Shopify: [TEST] 태그 주문 전부 취소(restock:true로 재고 복구). 취소된 기록은 남음(태그로 필터 가능).
//  - Supabase: 테스트 문의글(@example.com) + 딸린 답변·환불요청 삭제.
//
// 실행: node scripts/cleanup-test-data.mjs

import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const DOMAIN = env.SHOPIFY_STORE_DOMAIN
const TOKEN = env.SHOPIFY_ADMIN_API_TOKEN
const VER = env.SHOPIFY_API_VERSION || env.SHOPIFY_STOREFRONT_API_VERSION || '2026-04'
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = env.SUPABASE_SERVICE_ROLE_KEY

async function gql(query, variables) {
  const res = await fetch(`https://${DOMAIN}/admin/api/${VER}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables }),
  })
  return res.json()
}
async function supa(method, path) {
  const res = await fetch(`${SB_URL}/rest/v1${path}`, {
    method, headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: 'return=representation' },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function main() {
  // ── 1) Shopify: [TEST] 주문 취소 ──
  console.log('=== Shopify [TEST] 주문 취소 ===')
  const r = await gql(`query { orders(first: 50, query: "tag:TEST") { edges { node { id name cancelledAt } } } }`)
  const orders = (r.data?.orders?.edges ?? []).map(e => e.node)
  if (orders.length === 0) console.log('  대상 없음')
  for (const o of orders) {
    if (o.cancelledAt) { console.log(`  ${o.name}: 이미 취소됨 (스킵)`); continue }
    const c = await gql(
      `mutation($orderId: ID!) {
        orderCancel(orderId: $orderId, reason: OTHER, refund: false, restock: true, notifyCustomer: false) {
          orderCancelUserErrors { message }
        }
      }`,
      { orderId: o.id },
    )
    const errs = c.data?.orderCancel?.orderCancelUserErrors
    console.log(`  ${o.name}: ${errs?.length ? '실패 — ' + errs[0].message : '취소+재고복구'}`)
  }

  // ── 2) Supabase: 테스트 문의글 + 딸린 데이터 삭제 ──
  console.log('\n=== Supabase 테스트 문의글 삭제 ===')
  const qs = await supa('GET', '/questions?customer_email=ilike.*@example.com&select=id')
  const ids = (qs ?? []).map(q => q.id)
  if (ids.length === 0) { console.log('  대상 없음'); return }
  const inList = `(${ids.join(',')})`
  await supa('DELETE', `/answers?question_id=in.${inList}`)
  await supa('DELETE', `/refund_requests?question_id=in.${inList}`)
  await supa('DELETE', `/questions?id=in.${inList}`)
  console.log(`  문의글 ${ids.length}건 + 딸린 답변·환불요청 삭제`)
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
