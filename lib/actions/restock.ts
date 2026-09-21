'use server'

import { supabaseAdmin } from '@/lib/supabase/client'
import { shopifyClient } from '@/lib/shopify/client'

// variant 실존+품절 확인용 최소 쿼리. availableForSale=false 여야 '품절'이라 구독을 받는다.
const VARIANT_STOCK_QUERY = `
  query($id: ID!) {
    node(id: $id) {
      ... on ProductVariant { id availableForSale }
    }
  }
`

// 품절 variant 재입고 알림 신청.
// Supabase `restock_subscriptions`에 (variant_id, email) 단위로 저장한다.
// 실제 발송(재입고 시점)은 운영자가 테이블을 조회하거나, 추후 인벤토리 웹훅으로 자동화한다.
// → 지금 단계의 목표는 "품절 수요를 빠짐없이 수집"하는 것.

type SubscribeInput = {
  productId: string
  productTitle: string
  variantId: string
  variantTitle: string
  email: string
  lang: string
}

// 간단한 이메일 형식 검증 (서버에서도 한 번 더 — 클라이언트 우회 방지)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function subscribeRestock(
  input: SubscribeInput,
): Promise<{ success: true; already?: boolean } | { error: string }> {
  const email = input.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { error: 'invalid_email' }
  if (!input.variantId || !input.productId) return { error: 'missing_variant' }

  // 악용 방어: 실존하는 ProductVariant이고 '지금 품절'일 때만 구독을 받는다.
  // 재입고 폼은 품절 variant에서만 노출되므로 정상 사용자 UX엔 영향이 없다.
  // 임의 id로 쓰레기 행을 쌓거나, id를 바꿔가며 임의 이메일로 확인메일을 폭탄 발송하는 것을 차단.
  try {
    const { data, errors } = await shopifyClient.request(VARIANT_STOCK_QUERY, {
      variables: { id: input.variantId },
    })
    const variant = (data as { node?: { id?: string; availableForSale?: boolean } | null })?.node
    if (errors || !variant?.id) return { error: 'invalid_variant' }
    if (variant.availableForSale) return { error: 'in_stock' } // 조회~제출 사이 재입고된 레이스
  } catch {
    return { error: 'server_error' }
  }

  const { error } = await supabaseAdmin.from('restock_subscriptions').insert({
    product_id: input.productId,
    product_title: input.productTitle,
    variant_id: input.variantId,
    variant_title: input.variantTitle === 'Default Title' ? null : input.variantTitle,
    email,
    lang: input.lang,
  })

  // 동일 (variant_id, email) 미발송 건은 unique 인덱스로 막힘(코드 23505) — 이미 신청한 것이므로 성공 취급.
  if (error) {
    if (error.code === '23505') return { success: true, already: true }
    console.error('[restock] insert failed:', error)
    return { error: 'server_error' }
  }

  // 신청 확인 메일 — 베스트에포트(키 없거나 실패해도 신청 자체는 성공). 도메인 인증 후 운영에서 발송됨.
  sendRestockConfirmation(email, input).catch(() => {})

  return { success: true }
}

async function sendRestockConfirmation(email: string, input: SubscribeInput) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  const isJa = input.lang === 'ja'
  const name = input.productTitle + (input.variantTitle && input.variantTitle !== 'Default Title' ? ` (${input.variantTitle})` : '')
  const subject = isJa ? '再入荷通知のお申し込みを受け付けました' : '재입고 알림 신청이 접수되었습니다'
  const body = isJa
    ? `<p><b>${name}</b> の再入荷通知をお申し込みいただきました。</p><p>入荷次第、このメールアドレスにお知らせします。</p>`
    : `<p><b>${name}</b> 재입고 알림을 신청해 주셨습니다.</p><p>재입고되는 대로 이 이메일로 알려드리겠습니다.</p>`
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'applebuttercollege <support@applebuttercollege.com>',
      to: email,
      subject,
      html: `${body}<p style="color:#9A8F88;font-size:12px;margin-top:16px">applebuttercollege</p>`,
    }),
  })
}
