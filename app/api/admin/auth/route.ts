import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE, ADMIN_SESSION_MS, checkAdminPassword, makeAdminToken } from '@/lib/utils/admin-auth'

// 실패 시 응답을 늦춰 비밀번호 대입 속도를 떨어뜨린다(서버리스라 계정 잠금 상태 저장 대신 지연으로).
const FAIL_DELAY_MS = 1000

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const secret = String(formData.get('secret') ?? '')

  if (!checkAdminPassword(secret)) {
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS))
    return NextResponse.redirect(new URL('/admin/login?error=1', req.url))
  }

  const res = NextResponse.redirect(new URL('/admin/qa', req.url))
  res.cookies.set(ADMIN_COOKIE, makeAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MS / 1000,
    path: '/',
  })
  return res
}
