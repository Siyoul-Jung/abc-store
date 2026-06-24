// 문의 카테고리 단일 출처(SSOT). UI·관리자 필터·서버 검증이 모두 이 배열을 참조.
// 'return'·'defective'는 /returns 폼으로 유도되지만, 카테고리 값 자체는 유효해야 함.
export const QUESTION_CATEGORIES = ['shipping', 'return', 'defective', 'refund', 'product', 'other'] as const
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]
export type QuestionStatus = 'pending' | 'answered'
export type RefundStatus = 'pending' | 'processing' | 'completed'

export type Question = {
  id: string
  lang: string
  customer_id: string | null   // 로그인 고객만. 비회원은 null
  customer_name: string
  customer_email: string
  password_hash: string | null // 비회원 글 비밀번호(scrypt). 로그인 고객은 null
  category: QuestionCategory
  title: string
  content: string
  order_number: string | null
  is_private: boolean
  status: QuestionStatus
  created_at: string
  updated_at: string
  answers?: Answer[]
}

export type Answer = {
  id: string
  question_id: string
  content: string
  created_at: string
}

export type AnswerTemplate = {
  id: string
  category: QuestionCategory
  title: string
  content: string
  sort_order: number
}

export type RefundRequest = {
  id: string
  question_id: string
  customer_name: string
  customer_email: string
  order_number: string
  refund_amount: number
  bank_name: string | null
  account_number: string | null
  account_holder: string | null
  payment_type: string
  status: RefundStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}
