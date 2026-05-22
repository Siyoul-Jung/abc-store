export type QuestionCategory = 'shipping' | 'return' | 'refund' | 'product' | 'other'
export type QuestionStatus = 'pending' | 'answered'
export type RefundStatus = 'pending' | 'processing' | 'completed'

export type Question = {
  id: string
  lang: string
  customer_id: string
  customer_name: string
  customer_email: string
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
