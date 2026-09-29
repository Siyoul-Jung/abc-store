// Resend 메일 발송 공용 헬퍼 (서버 전용 — 'use server' 아님: 공개 액션으로 노출되면 안 됨).
//
// 메일은 부가 알림이라 실패해도 본 작업(환불 완료·주문 생성 등)을 깨뜨리지 않도록 throw하지 않는다.
// 대신 실패를 반드시 로그로 남긴다 — 예전엔 응답을 확인하지 않아, 도메인 미인증(403) 같은 거부가
// 화면에도 로그에도 안 남고 조용히 누락됐다(2026-09 관리자 환불 플로우 실측에서 발견).
// 수신자 주소는 로그에 남기지 않는다(PII) — tag·subject로 어떤 메일인지 식별.

export type EmailPayload = {
  from: string
  to: string
  bcc?: string
  subject: string
  html: string
}

export async function sendEmail(payload: EmailPayload, tag: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn(`[email:${tag}] RESEND_API_KEY 미설정 — 발송 생략: ${payload.subject}`)
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error(`[email:${tag}] 발송 실패 ${res.status}: ${detail} — ${payload.subject}`)
      return false
    }
    return true
  } catch (e) {
    console.error(`[email:${tag}] 발송 예외 — ${payload.subject}:`, e)
    return false
  }
}
