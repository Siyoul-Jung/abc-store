export type QuestionCategory = 'shipping' | 'return' | 'refund' | 'product' | 'other'
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
