'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/client'
import { caQuery } from '@/lib/shopify/customer-account'
import {
  hashPassword, verifyPassword,
  makeAccessToken, UNLOCK_TTL_MS, EMAIL_LINK_TTL_MS,
} from '@/lib/utils/qa-auth'
import type { QuestionCategory } from '@/lib/supabase/types'

// ─── 고객: 질문 작성 ───────────────────────────────────────────
// 하이브리드: 로그인 고객은 계정 신원으로, 비회원은 이름+이메일+글비밀번호로.
export async function createQuestion(formData: FormData) {
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  const lang = String(formData.get('lang') || 'ko')
  const category = String(formData.get('category') || 'other') as QuestionCategory
  const title = String(formData.get('title')).trim()
  const content = String(formData.get('content')).trim()
  const orderNumber = String(formData.get('order_number') || '').trim() || null

  // 공통 신원 필드 — 로그인이면 계정에서, 비회원이면 폼에서
  let customerId: string | null = null
  let customerName: string
  let customerEmail: string
  let passwordHash: string | null = null
  let notifyName: string

  if (token) {
    const customer = await caQuery<{
      customer: { id: string; firstName: string; lastName: string; emailAddress: { emailAddress: string } | null }
    }>(token, `{ customer { id firstName lastName emailAddress { emailAddress } } }`)
    if (!customer?.customer) throw new Error('고객 정보를 불러올 수 없습니다.')
    const c = customer.customer
    customerId = c.id
    customerName = `${c.firstName} ${c.lastName}`.trim() || '고객'
    customerEmail = c.emailAddress?.emailAddress ?? ''
    notifyName = c.firstName || c.lastName || '고객'
  } else {
    // 비회원: 이름·이메일·비밀번호 필수
    customerName = String(formData.get('customer_name') || '').trim()
    customerEmail = String(formData.get('customer_email') || '').trim()
    const password = String(formData.get('password') || '')
    if (!customerName || !/^\S+@\S+\.\S+$/.test(customerEmail) || password.length < 4) {
      throw new Error('이름·이메일·비밀번호(4자 이상)를 확인해주세요.')
    }
    passwordHash = hashPassword(password)
    notifyName = customerName
  }

  const { error } = await supabaseAdmin.from('questions').insert({
    lang,
    customer_id: customerId,
    customer_name: customerName,
    customer_email: customerEmail,
    password_hash: passwordHash,
    category,
    title,
    content,
    order_number: orderNumber,
    is_private: formData.get('is_private') === 'true',
  })

  if (error) throw new Error(error.message)

  await notifyAdminNewQuestion({ customerName: notifyName, title, category })

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

// ─── 비회원: 글 비밀번호 검증 → unlock 쿠키 발급 ─────────────────
// 성공 시 30분짜리 서명 쿠키를 심어 상세페이지가 본문을 렌더하게 한다.
export async function unlockGuestQuestion(
  questionId: string,
  password: string,
): Promise<{ ok: boolean }> {
  const { data: q } = await supabaseAdmin
    .from('questions')
    .select('password_hash')
    .eq('id', questionId)
    .single()

  if (!q?.password_hash || !verifyPassword(password, q.password_hash)) {
    return { ok: false }
  }

  const cookieStore = await cookies()
  cookieStore.set(`qa_unlock_${questionId}`, makeAccessToken(questionId, UNLOCK_TTL_MS), {
    httpOnly: true,
    maxAge: UNLOCK_TTL_MS / 1000,
    path: '/',
    sameSite: 'lax',
  })
  return { ok: true }
}

// ─── 비회원: 비밀번호 분실 → 이메일로 24시간 열람링크 전송 ───────
export async function sendQuestionAccessLink(
  questionId: string,
  lang: string,
): Promise<{ ok: boolean }> {
  const { data: q } = await supabaseAdmin
    .from('questions')
    .select('customer_email, title, password_hash')
    .eq('id', questionId)
    .single()

  // 비회원 글(비번 있음)만 대상. 결과는 항상 ok로 응답해 이메일 존재 여부를 노출하지 않음.
  if (q?.password_hash && q.customer_email) {
    const token = makeAccessToken(questionId, EMAIL_LINK_TTL_MS)
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${lang}/qa/${questionId}?token=${token}`
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const isJa = lang === 'ja'
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'applebuttercollege <no-reply@applebuttercollege.com>',
          to: q.customer_email,
          subject: isJa ? '【applebuttercollege】お問い合わせ閲覧リンク' : '[applebuttercollege] 문의 열람 링크',
          html: isJa
            ? `<p>「<b>${q.title}</b>」の閲覧リンクです（24時間有効）。</p><p><a href="${url}">お問い合わせを開く →</a></p>`
            : `<p>"<b>${q.title}</b>" 문의 열람 링크입니다 (24시간 유효).</p><p><a href="${url}">문의 열어보기 →</a></p>`,
        }),
      })
    }
  }
  return { ok: true }
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

  // 고객 이메일 알림 (특정 질문으로 링크 — 비회원은 게이트에서 비번 입력)
  const { data: q } = await supabaseAdmin.from('questions').select('customer_email, title').eq('id', questionId).single()
  if (q) {
    await notifyCustomerAnswered({ email: q.customer_email, title: q.title, lang, questionId })
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
  questionId,
}: {
  email: string
  title: string
  lang: string
  questionId: string
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
  const qUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${lang}/qa/${questionId}`
  const body = isJa
    ? `<p>「<b>${title}</b>」へのご回答が届きました。</p><p>下記リンクよりご確認ください（非会員の方は投稿時のパスワードが必要です）。</p><p><a href="${qUrl}">回答を確認する →</a></p>${notice}`
    : `<p>문의하신 "<b>${title}</b>"에 답변이 등록되었습니다.</p><p>아래 링크에서 확인해 주세요 (비회원은 작성 시 비밀번호가 필요합니다).</p><p><a href="${qUrl}">답변 확인하기 →</a></p>${notice}`

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
