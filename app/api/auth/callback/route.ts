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
  const verifier = cookieStore.get('_auth_verifier')?.value
  const redirectTo = cookieStore.get('_auth_redirect')?.value ?? '/'

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
  } catch (e) {
    console.error('[auth/callback] id_token decode error:', e)
  }

  const response = NextResponse.redirect(new URL(redirectTo, origin))
  response.cookies.delete('_auth_state')
  response.cookies.delete('_auth_verifier')
  response.cookies.delete('_auth_redirect')

  const cookieOpts = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge }

  response.cookies.set('customer_token', access_token, cookieOpts)
  response.cookies.set('customer_logged_in', '1', { ...cookieOpts, httpOnly: false })
  if (id_token) response.cookies.set('customer_id_token', id_token, cookieOpts)
  if (customerId) response.cookies.set('customer_id', customerId, cookieOpts)
  if (customerEmail) response.cookies.set('customer_email', customerEmail, cookieOpts)

  return response
}
