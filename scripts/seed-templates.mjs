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

// ──────────────────────────────────────────────────────────────
// applebuttercollege CS 답변 템플릿
// 메이크샵 CS 836건 분석 기반 · 현재 Shopify 정책에 맞게 재작성
//   분포: 배송 382(46%) · 기타 203 · 반품 102 · 교환 98 · 사이즈 51
// [ ] 대괄호 부분은 어드민이 상황에 맞게 채워넣는 자리표시자
// ──────────────────────────────────────────────────────────────

const templates = [
  // ─── 배송 (전체의 46%, 대부분 프리오더 출고 시기 문의) ───
  {
    category: 'shipping', sort_order: 1,
    title: '프리오더 출고 예정 안내',
    content:
`안녕하세요, applebuttercollege입니다.

문의해 주신 [상품명]은 [오픈일] 한정 수량으로 오픈된 프리오더 상품으로, [출고예정일]부터 주문 순서에 따라 순차 출고될 예정입니다.

해당 상품이 포함된 주문 건은 [출고예정일]부터 순차적으로 출고되는 점 참고 부탁드립니다.

이용해 주셔서 감사합니다.`,
  },
  {
    category: 'shipping', sort_order: 2,
    title: '입고 지연 사과',
    content:
`안녕하세요, applebuttercollege입니다.

해당 상품은 [출고예정일]부터 순차 출고 예정이었으나, 입고 일정이 지연되어 출고가 늦어지고 있습니다.

현재 입고를 기다리고 있으며, 입고되는 대로 주문 순서에 따라 순차 출고될 예정입니다. 늦어도 [예상완료일]까지 출고를 마무리할 수 있도록 하겠습니다.

기다려 주시는 만큼 빠르게 받아보실 수 있도록 더욱 노력하겠습니다. 불편을 드려 죄송하며, 양해 부탁드립니다.

감사합니다.`,
  },
  {
    category: 'shipping', sort_order: 3,
    title: '출고 완료 안내',
    content:
`안녕하세요, applebuttercollege입니다.

주문하신 상품은 [출고일] 출고되었습니다. 우체국 택배로 발송되며, 송장번호는 [송장번호]입니다.

배송은 보통 출고 후 1~3일 소요됩니다. 안전하게 받아보실 수 있도록 하겠습니다.

감사합니다.`,
  },
  {
    category: 'shipping', sort_order: 4,
    title: '합배송 불가 안내',
    content:
`안녕하세요, applebuttercollege입니다.

문의해 주신 주문 건은 합배송이 어려운 점 양해 부탁드립니다. 이는 재고 관리 및 배송 누락 방지를 위한 정책입니다.

상품별 출고 예정일이 다른 경우에도 각각 예정일에 맞춰 개별 출고됩니다. 여러 상품을 함께 받아보고 싶으신 경우, 기존 주문을 취소하신 뒤 원하시는 상품을 함께 재주문해 주시기를 안내드립니다.

불편을 드려 죄송합니다. 감사합니다.`,
  },
  {
    category: 'shipping', sort_order: 5,
    title: '배송지 변경 (출고 전)',
    content:
`안녕하세요, applebuttercollege입니다.

현재 주문 건은 아직 출고 전으로 확인되어, 요청해 주신 주소로 변경하여 출고 도와드리겠습니다.

· 변경 주소: [변경할 주소]

이미 출고된 이후에는 주소 변경이 어려우니 참고 부탁드립니다. 감사합니다.`,
  },
  {
    category: 'shipping', sort_order: 6,
    title: '제주·도서산간 배송비',
    content:
`안녕하세요, applebuttercollege입니다.

제주 및 도서산간 지역도 정상 배송 가능합니다. 다만 기본 배송비 외 추가 배송비가 발생합니다.

· 제주: +3,000원
· 도서산간: +4,000원

결제 단계에서 자동 반영됩니다. 감사합니다.`,
  },

  // ─── 교환/반품 (교환 98 + 반품 102 + 사이즈 51) ───
  {
    category: 'return', sort_order: 1,
    title: '교환 안내 (반품 후 재구매)',
    content:
`안녕하세요, applebuttercollege입니다.

사이즈 교환을 원하시는 경우, 번거로우시더라도 반품 신청 후 원하시는 상품으로 새로 주문해 주시기를 안내드립니다.

반품은 홈페이지 내 반품 신청 폼을 통해 접수해 주시면 우체국 기사님이 방문 수거해 드립니다. 수령 후 7일 이내, 미착용·미세탁 상태에서 신청 가능합니다.

이용에 불편을 드려 죄송하며, 빠르게 도와드리겠습니다. 감사합니다.`,
  },
  {
    category: 'return', sort_order: 2,
    title: '오배송·불량 교환',
    content:
`안녕하세요, applebuttercollege입니다.

먼저 상품 이용에 불편을 드려 죄송합니다. 말씀해 주신 [상품명] 건은 정상 상품으로 교환 처리 도와드리겠습니다.

우체국 기사님이 방문 수거하도록 예약해 드리며, 상품은 받으셨던 그대로 포장해 두시면 됩니다. 회수된 상품 확인 후 새 상품을 출고해 드립니다.

오배송·불량의 경우 회수 배송비는 저희가 부담하니 별도 비용은 발생하지 않습니다. 다시 한번 불편을 드려 죄송합니다. 감사합니다.`,
  },
  {
    category: 'return', sort_order: 3,
    title: '품질 불량 (교환/환불 선택)',
    content:
`안녕하세요, applebuttercollege입니다.

먼저 제품 상태로 불편을 드려 진심으로 죄송합니다. 문의해 주신 내용은 불량으로 확인되어, 교환 또는 환불로 처리해 드릴 수 있습니다.

원하시는 처리 방향을 알려주시면 안내에 따라 진행 도와드리겠습니다. 교환·환불 모두 우체국 기사님 방문 수거로 진행되며, 회수된 상품 확인 후 처리됩니다. 회수 배송비는 저희가 부담합니다.

더 나은 제품을 위해 노력하겠습니다. 감사합니다.`,
  },
  {
    category: 'return', sort_order: 4,
    title: '반품 신청 폼 안내',
    content:
`안녕하세요, applebuttercollege입니다.

반품은 개인정보(환불 계좌 등)를 안전하게 처리하기 위해 홈페이지 내 반품 신청 폼으로만 접수받고 있습니다.

마이페이지 또는 환불정책 안내의 반품 신청 폼에서 주문번호와 반품 사유를 입력해 주시면, 순차적으로 수거 예약 도와드리겠습니다.

감사합니다.`,
  },

  // ─── 환불 ───
  {
    category: 'refund', sort_order: 1,
    title: '환불 처리 안내',
    content:
`안녕하세요, applebuttercollege입니다.

반품 상품이 저희 측에 도착하여 확인이 완료되면 환불 처리해 드립니다.

· 카드 결제: 카드사 영업일 기준 3~5일 소요
· 계좌이체: 영업일 기준 1~3일 소요

상품 회수 후 빠르게 처리해 드리겠습니다. 감사합니다.`,
  },
  {
    category: 'refund', sort_order: 2,
    title: '환불 완료 안내',
    content:
`안녕하세요, applebuttercollege입니다.

요청해 주신 [주문번호] 건의 환불 처리가 완료되었습니다. 환불 금액은 [금액]원입니다.

결제 수단에 따라 실제 반영까지 영업일 기준 1~5일 소요될 수 있습니다. 이용해 주셔서 감사합니다.`,
  },
  {
    category: 'refund', sort_order: 3,
    title: '품절로 인한 부분 취소·환불',
    content:
`안녕하세요, applebuttercollege입니다.

기다려 주셨는데 안내드리게 되어 죄송합니다. 주문하신 상품 중 [상품명]이 공장 사정으로 품절되었습니다.

해당 상품은 부분 취소 처리해 드리며, 결제하신 금액 중 [금액]원을 환불해 드립니다. 나머지 상품은 정상 출고되는 점 참고 부탁드립니다.

불편을 드려 다시 한번 죄송합니다. 감사합니다.`,
  },

  // ─── 상품 ───
  {
    category: 'product', sort_order: 1,
    title: '소재·세탁 안내',
    content:
`안녕하세요, applebuttercollege입니다.

아이 건강을 생각해 주시는 마음 감사합니다. 문의하신 [상품명]의 소재 및 세탁 방법은 상품 상세 페이지의 '소재·관리' 안내에서 확인하실 수 있습니다.

추가로 궁금하신 점이 있으시면 편하게 문의 남겨주세요. 감사합니다.`,
  },
  {
    category: 'product', sort_order: 2,
    title: '재입고 문의',
    content:
`안녕하세요, applebuttercollege입니다.

문의해 주신 [상품명]은 현재 재입고 일정이 확정되지 않았습니다. 입고가 결정되면 상품 페이지를 통해 안내드릴 예정입니다.

관심 가져주셔서 감사합니다.`,
  },

  // ─── 기타 ───
  {
    category: 'other', sort_order: 1,
    title: 'CS 운영시간 안내',
    content:
`안녕하세요, applebuttercollege입니다.

고객센터는 평일(월~금) 오후 12시~4시에 운영됩니다. 주말 및 공휴일에 남겨주신 문의는 다음 영업일에 순차적으로 답변드립니다.

조금만 기다려 주시면 빠르게 확인하여 답변드리겠습니다. 감사합니다.`,
  },
  {
    category: 'other', sort_order: 2,
    title: '주문 취소 안내',
    content:
`안녕하세요, applebuttercollege입니다.

상품 준비 단계(출고 전)에서는 마이페이지 주문 내역에서 직접 취소가 가능합니다. 취소 시 결제하신 금액은 자동 환불됩니다.

이미 출고 준비가 시작된 주문은 취소가 어려울 수 있으니, 빠른 확인을 위해 주문번호와 함께 문의 남겨주시면 도와드리겠습니다. 감사합니다.`,
  },
  {
    category: 'other', sort_order: 3,
    title: '로그인·계정 문의',
    content:
`안녕하세요, applebuttercollege입니다.

저희 사이트는 별도의 비밀번호 없이 이메일 인증 코드로 로그인하는 방식입니다. 로그인 시 입력하신 이메일로 인증 코드가 발송됩니다.

코드가 도착하지 않는 경우 스팸 메일함을 확인해 주시고, 그래도 받지 못하셨다면 가입하신 이메일 주소와 함께 다시 문의 남겨주세요. 빠르게 확인해 드리겠습니다.

감사합니다.`,
  },
]

async function seed() {
  console.log('기존 답변 템플릿 삭제 중...')
  await rpc('DELETE', '/answer_templates?id=not.is.null', undefined)

  console.log(`템플릿 ${templates.length}개 삽입 중...`)
  const inserted = await rpc('POST', '/answer_templates', templates)
  console.log(`완료! ${inserted.length}개 삽입됨\n`)

  const byCategory = templates.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1
    return acc
  }, {})
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count}개`)
  }
}

seed().catch(console.error)
