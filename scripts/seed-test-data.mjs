// CS 담당자 교육용 테스트 데이터 시드 — 실제 Shopify 주문 + 연결된 Q&A 문의글.
// 메이크샵 CS 836건 분포(배송46%·반품·교환·사이즈·환불) 기반 시나리오.
//
// 실행: node scripts/seed-test-data.mjs
// 정리: node scripts/cleanup-test-data.mjs  (주문 취소+재고복구, 문의글 삭제)
//
// ⚠️ 라이브 Shopify 스토어에 실제 주문을 생성한다(재고 차감). 전부 [TEST] 태그.
// ⚠️ 출고(Fulfill)는 토큰 권한 밖이라 자동화 불가 → 반품 시나리오(B·C·D)는
//    실행 후 Shopify Admin에서 직접 '품목 이행(Fulfill)' 1클릭 필요(= 실무 워크플로우 동일).

import { readFileSync, writeFileSync } from 'fs'

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

async function shopify(method, path, body) {
  const res = await fetch(`https://${DOMAIN}/admin/api/${VER}${path}`, {
    method, headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json)}`)
  return json
}
async function supa(method, path, body) {
  const res = await fetch(`${SB_URL}/rest/v1${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

// ── 생성할 주문 (B·C·D). A는 기존 probe 주문 #1036 재사용 ──
const NEW_ORDERS = [
  { key: 'B', name: '김반품', email: 'kim-test@example.com', variantId: 48909127287012, note: '[TEST] 단순변심 반품 시나리오' },
  { key: 'C', name: '이교환', email: 'lee-test@example.com', variantId: 48909127057636, note: '[TEST] 사이즈 교환 시나리오' },
  { key: 'D', name: '박불량', email: 'park-test@example.com', variantId: 48909127811300, note: '[TEST] 불량/오배송 시나리오' },
]

async function createOrder(o) {
  const json = await shopify('POST', '/orders.json', {
    order: {
      line_items: [{ variant_id: o.variantId, quantity: 1 }],
      customer: { first_name: o.name, last_name: '(TEST)', email: o.email },
      email: o.email,
      financial_status: 'paid',
      tags: 'TEST',
      note: o.note,
      send_receipt: false,
      send_fulfillment_receipt: false,
      inventory_behaviour: 'decrement_obeying_policy',
    },
  })
  return { ...o, orderName: json.order.name, orderId: json.order.id }
}

async function main() {
  console.log('=== 1) 테스트 주문 생성 (B·C·D) ===')
  const created = []
  for (const o of NEW_ORDERS) {
    const r = await createOrder(o)
    console.log(`  ${r.key}: ${r.orderName}  (${r.name}, ${r.email})`)
    created.push(r)
  }

  // A = 기존 probe 주문 #1036
  const orderA = { key: 'A', name: '테스트 구매자', orderName: '#1036', orderId: 6782047060196 }
  const map = { A: orderA, ...Object.fromEntries(created.map(r => [r.key, r])) }

  // ── 2) 문의글 시드 (CS 분포 반영: 배송3·반품1·교환1·불량1·환불1) ──
  console.log('\n=== 2) Q&A 문의글 시드 ===')
  const questions = [
    {
      category: 'shipping', is_private: true,
      customer_name: orderA.name, customer_email: 'test-cs-probe@example.com', order_number: orderA.orderName,
      title: '주문한 상품 언제 출고되나요?',
      content: `어제 ${orderA.orderName} 주문했는데 아직 배송 시작 안 된 것 같아요. 언제쯤 받아볼 수 있을까요?`,
    },
    {
      category: 'shipping', is_private: false, customer_name: '최프리', customer_email: 'choi-test@example.com', order_number: null,
      title: '프리오더 상품 출고 예정일 문의',
      content: '프리오더로 표시된 상품을 주문하려는데, 언제쯤 출고되는지 미리 알 수 있을까요?',
    },
    {
      category: 'shipping', is_private: true, customer_name: '정제주', customer_email: 'jeju-test@example.com', order_number: null,
      title: '제주도인데 배송비가 추가됐어요',
      content: '결제하려는데 배송비가 평소보다 더 붙던데, 제주도라서 그런가요? 얼마가 추가되는 건가요?',
    },
    {
      category: 'return', is_private: true, customer_name: map.B.name, customer_email: map.B.email, order_number: map.B.orderName,
      title: '단순 변심인데 반품 가능한가요?',
      content: `${map.B.orderName} 받았는데 생각했던 색감이랑 달라서 반품하고 싶어요. 어떻게 신청하나요? 배송비는 제가 부담하나요?`,
    },
    {
      category: 'return', is_private: true, customer_name: map.C.name, customer_email: map.C.email, order_number: map.C.orderName,
      title: '사이즈 교환하고 싶어요',
      content: `${map.C.orderName} 받았는데 아이한테 좀 작네요. 한 사이즈 큰 걸로 교환 가능할까요?`,
    },
    {
      category: 'defective', is_private: true, customer_name: map.D.name, customer_email: map.D.email, order_number: map.D.orderName,
      title: '받은 상품에 불량이 있어요',
      content: `${map.D.orderName} 오늘 받았는데 박음질이 터져 있고 얼룩도 있어요. 불량인 것 같은데 어떻게 처리되나요?`,
    },
    {
      category: 'refund', is_private: true, customer_name: '한환불', customer_email: 'han-test@example.com', order_number: null,
      title: '환불은 언제 입금되나요?',
      content: '며칠 전에 반품 보냈는데 환불이 아직 안 들어왔어요. 보통 며칠 걸리나요?',
    },
  ]

  const rows = questions.map(q => ({
    lang: 'ko',
    customer_id: null,
    customer_name: q.customer_name,
    customer_email: q.customer_email,
    password_hash: null,       // 관리자(/admin/qa)는 게이트 없이 열람 — 교육은 관리자 화면 기준
    category: q.category,
    title: q.title,
    content: q.content,
    order_number: q.order_number,
    is_private: q.is_private,
    status: 'pending',
  }))
  const inserted = await supa('POST', '/questions', rows)
  console.log(`  문의글 ${inserted.length}건 삽입`)

  // ── 3) 요약 + 담당자 안내 ──
  writeFileSync('scripts/.test-data-manifest.json', JSON.stringify({ orders: map, questionEmails: rows.map(r => r.customer_email) }, null, 2))
  console.log('\n=== 완료 ===')
  console.log('주문:', Object.values(map).map(o => `${o.key}=${o.orderName}`).join('  '))
  console.log('\n⚠️ 다음 단계(필수): Shopify Admin > 주문에서 아래 3건을 "품목 이행(Fulfill)" 처리하세요.')
  console.log('   (반품 조회는 출고완료 주문만 가능 — 실무와 동일)')
  console.log(`   - ${map.B.orderName} (${map.B.name})  ← 단순변심 반품`)
  console.log(`   - ${map.C.orderName} (${map.C.name})  ← 사이즈 교환`)
  console.log(`   - ${map.D.orderName} (${map.D.name})  ← 불량`)
  console.log('\n담당자 연습: /admin/qa 에서 7건 답변 → /returns 에서 반품신청 → /admin/returns 처리')
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1) })
