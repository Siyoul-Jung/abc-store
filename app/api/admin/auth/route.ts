import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const secret = String(formData.get('secret') ?? '')

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.redirect(new URL('/admin/login?error=1', req.url))
  }

  const res = NextResponse.redirect(new URL('/admin/qa', req.url))
  res.cookies.set('admin_auth', secret, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8시간
    path: '/',
  })
  return res
}
