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

  // 이메일 조회 (주문 조회에 사용)
  let customerEmail = ''
  try {
    const CA_ENDPOINT = `https://shopify.com/${SHOP_ID}/account/customer/api/2026-04/graphql`
    const profileRes = await fetch(CA_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: access_token },
      body: JSON.stringify({ query: '{ customer { emailAddress { emailAddress } } }' }),
      cache: 'no-store',
    })
    if (profileRes.ok) {
      const profileData = await profileRes.json()
      customerEmail = profileData?.data?.customer?.emailAddress?.emailAddress ?? ''
    }
  } catch { /* 이메일 조회 실패 시 무시 */ }

  const response = NextResponse.redirect(new URL(redirectTo, origin))

  response.cookies.delete('_auth_state')
  response.cookies.delete('_auth_verifier')
  response.cookies.delete('_auth_redirect')

  response.cookies.set('customer_token', access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
  response.cookies.set('customer_logged_in', '1', {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
  if (customerEmail) {
    response.cookies.set('customer_email', customerEmail, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge,
    })
  }
  if (id_token) {
    response.cookies.set('customer_id_token', id_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge,
    })
  }

  return response
}
