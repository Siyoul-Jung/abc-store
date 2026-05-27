import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Prefer': 'return=representation',
}

async function rpc(method, path, body) {
  const res = await fetch(`${URL}/rest/v1${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

// 실제 Shopify 주문 데이터
// #1003 - philoleben@gmail.com (ABC SKIN SET 공룡월드 XS, 공사장 XS, 긴급출동 S)
// #1002 - gainzo_@naver.com   (ABC SKIN SET 핑크 공룡 M, 피그 베이비 핑크 M)
// #1001 - hana9906@gmail.com  (ABC SKIN SET 딸기우유 S, 아이스크림맨 S)

const questions = [
  {
    lang: 'ko', customer_id: 'gid://shopify/Customer/seed-001',
    customer_name: '정필립', customer_email: 'philoleben@gmail.com',
    category: 'shipping', title: '배송이 언제 출발하나요?',
    content: '#1003 주문했는데 아직 배송 출발 안 했어요. ABC SKIN SET 세 가지 주문했는데 언제쯤 출발할지 알 수 있을까요?',
    order_number: '#1003', is_private: false, status: 'answered',
  },
  {
    lang: 'ko', customer_id: 'gid://shopify/Customer/seed-002',
    customer_name: '이서연', customer_email: 'gainzo_@naver.com',
    category: 'return', title: '사이즈 교환 가능한가요?',
    content: '#1002 주문에서 ABC SKIN SET 핑크 공룡 M 사이즈 구매했는데 아이한테 커서 S로 교환하고 싶어요.',
    order_number: '#1002', is_private: false, status: 'answered',
  },
  {
    lang: 'ko', customer_id: 'gid://shopify/Customer/seed-003',
    customer_name: '하나', customer_email: 'hana9906@gmail.com',
    category: 'product', title: 'ABC SKIN SET 소재가 어떻게 되나요?',
    content: '#1001로 딸기우유 세트 주문했어요. 아이가 피부가 약한데 소재 성분이 어떻게 되는지 알 수 있을까요?',
    order_number: '#1001', is_private: false, status: 'answered',
  },
  {
    lang: 'ko', customer_id: 'gid://shopify/Customer/seed-004',
    customer_name: '이서연', customer_email: 'gainzo_@naver.com',
    category: 'refund', title: '환불 처리가 언제 되나요?',
    content: '#1002 반품 택배 보낸 지 4일 됐는데 아직 환불이 안 됐어요. 피그 베이비 핑크 세트 반품했습니다.',
    order_number: '#1002', is_private: true, status: 'pending',
  },
  {
    lang: 'ko', customer_id: 'gid://shopify/Customer/seed-005',
    customer_name: '정하은', customer_email: 'haeun@example.com',
    category: 'shipping', title: '제주도 배송 가능한가요?',
    content: '제주도 거주 중인데 배송 가능한지, 추가 배송비가 있는지 궁금합니다.',
    order_number: null, is_private: false, status: 'pending',
  },
  {
    lang: 'ko', customer_id: 'gid://shopify/Customer/seed-006',
    customer_name: '강다인', customer_email: 'dain@example.com',
    category: 'other', title: '선물 포장 되나요?',
    content: '돌잔치 선물로 구매하려는데 선물 포장 서비스가 있나요? 메시지 카드도 넣을 수 있으면 좋겠어요.',
    order_number: null, is_private: false, status: 'pending',
  },
  {
    lang: 'ja', customer_id: 'gid://shopify/Customer/seed-007',
    customer_name: '田中さくら', customer_email: 'sakura@example.jp',
    category: 'shipping', title: '日本への配送は可能ですか？',
    content: '日本在住ですが、配送は可能でしょうか？送料についても教えていただけますか。',
    order_number: null, is_private: false, status: 'pending',
  },
]

const answerContents = {
  '배송이 언제 출발하나요?': '안녕하세요, applebuttercollege입니다.\n주문 확인 후 영업일 기준 1~2일 내 출고됩니다. 주말·공휴일은 출고가 지연될 수 있습니다. 현재 주문하신 상품은 내일 출고 예정입니다. 송장번호는 출고 후 문자로 발송됩니다. 감사합니다.',
  '사이즈 교환 가능한가요?': '안녕하세요!\n사이즈 교환은 수령 후 7일 이내, 미착용·미세탁 상태에서 가능합니다.\n반품 택배로 보내주시면 교환 처리해 드리겠습니다.\n반품 주소: 서울시 강남구 테헤란로 123 (수신: 교환/반품 담당)\n추가 문의는 게시판으로 남겨주세요.',
  'ABC SKIN SET 소재가 어떻게 되나요?': '안녕하세요! 아이 건강을 걱정해 주시는 마음 감사합니다.\nABC SKIN SET은 100% 유기농 면(GOTS 인증)으로 제작되었습니다. 형광증백제, 방부제 없이 천연 염색으로 처리되어 민감한 피부나 아토피 아이에게도 안전하게 착용 가능합니다.',
}

async function seed() {
  console.log('기존 시드 데이터 삭제 중...')
  await rpc('DELETE', '/questions?customer_id=like.*seed*', undefined)

  console.log('질문 삽입 중...')
  const inserted = await rpc('POST', '/questions', questions)
  console.log(`질문 ${inserted.length}개 삽입 완료`)

  console.log('답변 삽입 중...')
  for (const q of inserted) {
    const content = answerContents[q.title]
    if (!content) continue
    await rpc('POST', '/answers', [{ question_id: q.id, content }])
    console.log(`  답변 완료: "${q.title}"`)
  }

  // 환불 요청 시드 — "환불 처리가 언제 되나요?" 질문에 연결
  const refundQ = inserted.find(q => q.title === '환불 처리가 언제 되나요?')
  if (refundQ) {
    await rpc('POST', '/refund_requests', [{
      question_id: refundQ.id,
      customer_name: refundQ.customer_name,
      customer_email: refundQ.customer_email,
      order_number: '#1002',
      refund_amount: 49000,
      bank_name: '카카오뱅크',
      account_number: '3333-01-2345678',
      account_holder: '이서연',
      payment_type: 'bank_transfer',
      status: 'pending',
    }])
    console.log('  환불 요청 등록: "환불 처리가 언제 되나요?" (대기 중)')
  }

  console.log('\n완료!')
  console.log(`- 답변대기: ${questions.filter(q => q.status === 'pending').length}개`)
  console.log(`- 답변완료: ${questions.filter(q => q.status === 'answered').length}개`)
  console.log(`- 비공개: ${questions.filter(q => q.is_private).length}개`)
  console.log(`- 일본어: ${questions.filter(q => q.lang === 'ja').length}개`)
  console.log(`- 환불 요청: 1개 (대기)`)
}

seed().catch(console.error)
