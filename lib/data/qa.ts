// Q&A 읽기(조회) 함수 — 서버 컴포넌트 전용 데이터 접근 계층.
//
// ⚠️ 'use server' 없음 — 의도적. 이 함수들은 오직 서버 컴포넌트(page.tsx)에서만 호출되는
// 순수 조회 함수다. lib/actions/qa.ts(모듈 상단 'use server')에 두면 export가 전부
// 서버 액션으로 승격돼 공개 POST 엔드포인트가 될 수 있는데, 여기서 반환하는 데이터는
// 전체 비공개 질문·고객 이메일·refund_requests(환불 계좌)라 인증 없이 노출되면 치명적이다.
// → 액션(mutation)은 lib/actions/qa.ts, 조회는 이 파일로 분리해 구조적으로 엔드포인트가
//   되지 않게 한다. 클라이언트 컴포넌트에서 임포트 금지(서버 컴포넌트에서만).
import { supabaseAdmin } from '@/lib/supabase/client'

// ─── 고객: 내 질문 목록 ────────────────────────────────────────
// customerId는 서버 컴포넌트가 로그인 토큰에서 도출해 넘긴다(이 함수는 엔드포인트가 아니므로 신뢰 가능).
export async function getMyQuestions(customerId: string) {
  const { data } = await supabaseAdmin
    .from('questions')
    .select('*, answers(*)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  return data ?? []
}

// ─── 공개 답변완료 질문 목록 ────────────────────────────────────
export async function getPublicQuestions(category?: string) {
  let query = supabaseAdmin
    .from('questions')
    .select('*, answers(*)')
    .eq('is_private', false)
    .eq('status', 'answered')
    .order('created_at', { ascending: false })
    .limit(30)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data } = await query
  return data ?? []
}

// ─── 어드민: 전체 질문 목록 ─────────────────────────────────────
export async function getAdminQuestions(status?: string, category?: string) {
  let query = supabaseAdmin
    .from('questions')
    .select('*, answers(*), refund_requests(*)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (category && category !== 'all') query = query.eq('category', category)

  const { data } = await query
  return data ?? []
}

// ─── 질문 상세 ─────────────────────────────────────────────────
export async function getQuestion(id: string) {
  const { data } = await supabaseAdmin
    .from('questions')
    .select('*, answers(*), refund_requests(*)')
    .eq('id', id)
    .single()
  return data
}

// ─── 답변 템플릿 조회 ──────────────────────────────────────────
export async function getAnswerTemplates() {
  const { data } = await supabaseAdmin
    .from('answer_templates')
    .select('*')
    .order('sort_order', { ascending: true })
  return data ?? []
}
