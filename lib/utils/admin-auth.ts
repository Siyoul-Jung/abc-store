import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

// 관리자 인증 — 단일 출처. 페이지 가드(isAdmin)·서버 액션 가드(requireAdmin)·라우트(isValidAdminToken) 공용.
//
// 쿠키에는 비밀번호가 아니라 "만료시각 + HMAC 서명" 토큰을 담는다. 예전엔 비밀번호 원문을 쿠키에
// 그대로 넣고 `쿠키 === ADMIN_SECRET`로 비교해서 ①쿠키 유출 = 비밀번호 유출 ②ADMIN_SECRET 미설정 시
// undefined === undefined로 누구나 통과(fail-open)였다. 이제 미설정이면 전부 거부한다(fail-closed).

export const ADMIN_COOKIE = 'admin_auth'
export const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000 // 8시간

// 서명 키는 ADMIN_SECRET에서 용도별로 파생 — 같은 ADMIN_SECRET을 쓰는 비회원 Q&A 접근토큰(qa-auth)과
// 서명이 섞여 한쪽 토큰이 다른 쪽에서 통하는 일이 없게 한다.
function sessionKey(): Buffer | null {
  const s = process.env.ADMIN_SECRET
  return s ? createHmac('sha256', s).update('admin-session-v1').digest() : null
}

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a)
  const B = Buffer.from(b)
  return A.length === B.length && timingSafeEqual(A, B)
}

export function checkAdminPassword(input: string): boolean {
  const s = process.env.ADMIN_SECRET
  return !!s && safeEqual(input, s)
}

// 형식: <만료ms>.<hmac hex>
export function makeAdminToken(): string {
  const key = sessionKey()
  if (!key) throw new Error('ADMIN_SECRET 미설정')
  const exp = String(Date.now() + ADMIN_SESSION_MS)
  return `${exp}.${createHmac('sha256', key).update(exp).digest('hex')}`
}

export function isValidAdminToken(token: string | undefined | null): boolean {
  const key = sessionKey()
  if (!key || !token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [expStr, sig] = parts
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Date.now()) return false
  return safeEqual(sig, createHmac('sha256', key).update(expStr).digest('hex'))
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)
}

// 관리자 전용 서버 액션 인증 가드.
// 서버 액션은 사실상 공개 POST 엔드포인트라, 관리자 페이지 가드만으로는 부족하다.
// 관리자 쓰기 액션은 액션 내부에서도 반드시 이걸 호출한다(관리자 페이지와 동일 기준).
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('관리자 인증이 필요합니다.')
  }
}
