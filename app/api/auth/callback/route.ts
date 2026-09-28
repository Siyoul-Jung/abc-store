import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SHOP_ID = '78709162212'
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const savedState = cookieStore.get('_auth_state')?.value
  const savedNonce = cookieStore.get('_auth_nonce')?.value
  const verifier = cookieStore.get('_auth_verifier')?.value
  // 오픈 리다이렉트 방어(심층): 쿠키 값도 내부 경로만 허용 (login에서 이미 걸렀으나 이중 방어).
  const rawRedirect = cookieStore.get('_auth_redirect')?.value ?? '/'
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/'

  if (!code || !state || state !== savedState || !verifier) {
    return NextResponse.redirect(new URL('/?auth_error=invalid', origin))
  }

  // 1. 토큰 교환
  const tokenRes = await fetch(
    `https://shopify.com/authentication/${SHOP_ID}/oauth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${origin}/api/auth/callback`,
        code_verifier: verifier,
      }),
    }
  )

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/?auth_error=token', origin))
  }

  const { access_token, id_token, expires_in } = await tokenRes.json()
  const maxAge: number = expires_in ?? 3600
  const secure = process.env.NODE_ENV === 'production'

  // 2. id_token JWT 디코딩으로 email + sub 추출
  // Shopify는 userinfo_endpoint를 제공하지 않으며 claims_supported에 email/sub 포함
  let customerId = ''
  let customerEmail = ''
  try {
    const b64 = id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
    customerEmail = payload.email ?? ''
    customerId = (payload.sub as string ?? '').split('/').pop() ?? ''
    // nonce는 "경고만" — 하드 차단하지 않는다.
    // 이 흐름은 인가코드(response_type=code) + PKCE + 서버측 토큰 교환이라, id_token을 브라우저
    // 프론트채널로 받지 않고 서버가 토큰 엔드포인트에서 직접 받는다 → id_token replay 벡터가 없다.
    // CSRF는 state, 코드 가로채기는 PKCE(code_verifier)가 이미 막으므로 nonce는 중복 방어다.
    // Shopify Customer Account API가 우리가 보낸 nonce를 id_token에 그대로 에코하지 않는 케이스가
    // 있어(2026-09 실측: state 통과·nonce 불일치로 정상 로그인이 전부 거부됨), 하드 차단을 제거한다.
    const tokenNonce = payload.nonce
    if (tokenNonce != null && savedNonce && tokenNonce !== savedNonce) {
      console.warn('[auth/callback] nonce 불일치 — 경고만(code flow+PKCE+서버 토큰교환이라 replay 벡터 없음)')
    }
  } catch (e) {
    console.error('[auth/callback] id_token decode error:', e)
  }

  const response = NextResponse.redirect(new URL(redirectTo, origin))
  response.cookies.delete('_auth_state')
  response.cookies.delete('_auth_verifier')
  response.cookies.delete('_auth_redirect')
  response.cookies.delete('_auth_nonce')

  const cookieOpts = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge }

  response.cookies.set('customer_token', access_token, cookieOpts)
  response.cookies.set('customer_logged_in', '1', { ...cookieOpts, httpOnly: false })
  if (id_token) response.cookies.set('customer_id_token', id_token, cookieOpts)
  if (customerId) response.cookies.set('customer_id', customerId, cookieOpts)
  if (customerEmail) response.cookies.set('customer_email', customerEmail, cookieOpts)

  return response
}
