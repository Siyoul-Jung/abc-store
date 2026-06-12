import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'

// 비회원 Q&A 인증 유틸 — 외부 의존성 없이 node:crypto만 사용.
//  · 글 비밀번호: scrypt 해시로 저장 (평문 저장 절대 금지)
//  · 접근 토큰: HMAC 서명 (비번 검증 후 발급하는 unlock 쿠키 / 비번분실 이메일 링크 공용)

// ── 글 비밀번호 (scrypt) ──────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  const hashBuf = Buffer.from(hash, 'hex')
  return hashBuf.length === test.length && timingSafeEqual(hashBuf, test)
}

// ── 접근 토큰 (HMAC, 만료 포함) ───────────────────────────────────
// 형식: <questionId>.<expiryMs>.<hmac>. unlock 쿠키와 이메일 열람링크에 공용.
function secret(): string {
  return process.env.ADMIN_SECRET || 'dev-only-insecure-secret'
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex')
}

export function makeAccessToken(questionId: string, ttlMs: number): string {
  const exp = Date.now() + ttlMs
  const payload = `${questionId}.${exp}`
  return `${payload}.${sign(payload)}`
}

export function verifyAccessToken(questionId: string, token: string | undefined | null): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [qid, expStr, sig] = parts
  if (qid !== questionId) return false
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Date.now()) return false
  const expected = sign(`${qid}.${exp}`)
  const sigBuf = Buffer.from(sig)
  const expBuf = Buffer.from(expected)
  return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)
}

// unlock 쿠키 30분, 이메일 열람링크 24시간
export const UNLOCK_TTL_MS = 30 * 60 * 1000
export const EMAIL_LINK_TTL_MS = 24 * 60 * 60 * 1000
