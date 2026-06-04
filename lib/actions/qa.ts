'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/client'
import { caQuery } from '@/lib/shopify/customer-account'
import type { QuestionCategory } from '@/lib/supabase/types'

// ─── 고객: 질문 작성 ───────────────────────────────────────────
export async function createQuestion(formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value
  if (!token) redirect('/api/auth/login')

  const customer = await caQuery<{
    customer: { id: string; firstName: string; lastName: string; emailAddress: { emailAddress: string } | null }
  }>(token, `{ customer { id firstName lastName emailAddress { emailAddress } } }`)

  if (!customer?.customer) throw new Error('고객 정보를 불러올 수 없습니다.')
  const c = customer.customer

  const lang = String(formData.get('lang') || 'ko')
  const { error } = await supabaseAdmin.from('questions').insert({
    lang,
    customer_id: c.id,
    customer_name: `${c.firstName} ${c.lastName}`.trim() || '고객',
    customer_email: c.emailAddress?.emailAddress ?? '',
    category: String(formData.get('category') || 'other') as QuestionCategory,
    title: String(formData.get('title')).trim(),
    content: String(formData.get('content')).trim(),
    order_number: String(formData.get('order_number') || '').trim() || null,
    is_private: formData.get('is_private') === 'true',
  })

  if (error) throw new Error(error.message)

  await notifyAdminNewQuestion({
    customerName: c.firstName || c.lastName || '고객',
    title: String(formData.get('title')),
    category: String(formData.get('category')),
  })

  revalidatePath(`/${lang}/qa`)
  redirect(`/${lang}/qa`)
}

// ─── 고객: 내 질문 목록 ────────────────────────────────────────
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

// ─── 어드민: 답변 작성 ─────────────────────────────────────────
export async function submitAnswer(questionId: string, content: string, lang: string) {
  const { error: ansErr } = await supabaseAdmin.from('answers').insert({
    question_id: questionId,
    content,
  })
  if (ansErr) throw new Error(ansErr.message)

  const { error: qErr } = await supabaseAdmin
    .from('questions')
    .update({ status: 'answered', updated_at: new Date().toISOString() })
    .eq('id', questionId)
  if (qErr) throw new Error(qErr.message)

  // 고객 이메일 알림
  const { data: q } = await supabaseAdmin.from('questions').select('customer_email, title').eq('id', questionId).single()
  if (q) {
    await notifyCustomerAnswered({ email: q.customer_email, title: q.title, lang })
  }

  revalidatePath('/admin/qa')
  revalidatePath(`/admin/qa/${questionId}`)
}

// ─── 답변 템플릿 조회 ──────────────────────────────────────────
export async function getAnswerTemplates() {
  const { data } = await supabaseAdmin
    .from('answer_templates')
    .select('*')
    .order('sort_order', { ascending: true })
  return data ?? []
}

// ─── 환불 요청 저장 ────────────────────────────────────────────
export async function createRefundRequest(questionId: string, formData: FormData) {
  const { error } = await supabaseAdmin.from('refund_requests').insert({
    question_id: questionId,
    customer_name: String(formData.get('customer_name')),
    customer_email: String(formData.get('customer_email')),
    order_number: String(formData.get('order_number')),
    refund_amount: Number(formData.get('refund_amount')),
    bank_name: String(formData.get('bank_name') || ''),
    account_number: String(formData.get('account_number') || ''),
    account_holder: String(formData.get('account_holder') || ''),
    payment_type: String(formData.get('payment_type') || 'bank_transfer'),
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/qa/${questionId}`)
}

// ─── 환불 상태 업데이트 ────────────────────────────────────────
export async function updateRefundStatus(
  refundId: string,
  status: 'processing' | 'completed',
  adminNote?: string,
) {
  const { error } = await supabaseAdmin
    .from('refund_requests')
    .update({ status, admin_note: adminNote ?? null, updated_at: new Date().toISOString() })
    .eq('id', refundId)
  if (error) throw new Error(error.message)

  if (status === 'completed') {
    const { data: r } = await supabaseAdmin
      .from('refund_requests')
      .select('customer_email, order_number, refund_amount, questions(lang)')
      .eq('id', refundId)
      .single()
    if (r) {
      const lang = (r.questions as unknown as { lang: string } | null)?.lang ?? 'ko'
      await notifyCustomerRefundComplete({
        email: r.customer_email,
        orderNumber: r.order_number,
        amount: r.refund_amount,
        lang,
      })
    }
  }

  revalidatePath('/admin/qa')
}

// ─── 이메일 알림 ───────────────────────────────────────────────
async function notifyAdminNewQuestion({
  customerName,
  title,
  category,
}: {
  customerName: string
  title: string
  category: string
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  const resendKey = process.env.RESEND_API_KEY
  if (!adminEmail || !resendKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `applebuttercollege <no-reply@applebuttercollege.com>`,
      to: adminEmail,
      subject: `[새 문의] ${title}`,
      html: `<p><b>${customerName}</b>님이 새 문의를 남겼습니다.</p><p>분류: ${category}</p><p>제목: ${title}</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/qa">어드민에서 확인하기 →</a></p>`,
    }),
  })
}

async function notifyCustomerAnswered({
  email,
  title,
  lang,
}: {
  email: string
  title: string
  lang: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const isJa = lang === 'ja'
  const subject = isJa
    ? `【applebuttercollege】お問い合わせに回答しました`
    : `[applebuttercollege] 문의에 답변이 등록되었습니다`
  const notice = isJa
    ? `<p style="color:#9A8F88;font-size:12px;margin-top:16px">本メールは送信専用です。追加のお問い合わせはマイお問い合わせページよりお願いいたします。</p>`
    : `<p style="color:#9A8F88;font-size:12px;margin-top:16px">본 메일은 발신전용입니다. 추가 문의는 내 문의 페이지에서 남겨주세요.</p>`
  const body = isJa
    ? `<p>「<b>${title}</b>」へのご回答が届きました。</p><p>下記リンクよりご確認ください。</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/${lang}/qa">マイお問い合わせを確認する →</a></p>${notice}`
    : `<p>문의하신 "<b>${title}</b>"에 답변이 등록되었습니다.</p><p>아래 링크에서 확인해 주세요.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/${lang}/qa">내 문의 확인하기 →</a></p>${notice}`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `applebuttercollege <no-reply@applebuttercollege.com>`,
      to: email,
      subject,
      html: body,
    }),
  })
}

async function notifyCustomerRefundComplete({
  email,
  orderNumber,
  amount,
  lang,
}: {
  email: string
  orderNumber: string
  amount: number
  lang: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `applebuttercollege <no-reply@applebuttercollege.com>`,
      to: email,
      subject: `[applebuttercollege] 환불이 완료되었습니다`,
      html: `<p>주문번호 <b>${orderNumber}</b>의 환불 처리가 완료되었습니다.</p><p>환불 금액: <b>${amount.toLocaleString()}원</b></p><p>영업일 기준 1~2일 내 입금됩니다.</p><p style="color:#9A8F88;font-size:12px;margin-top:16px">본 메일은 발신전용입니다. 추가 문의는 고객센터 게시판을 이용해 주세요.</p>`,
    }),
  })
}
