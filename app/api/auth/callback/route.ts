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

  // id_token JWT 디코딩으로 이메일 + customer ID 추출
  let customerEmail = ''
  let customerId = ''
  try {
    const payload = JSON.parse(
      Buffer.from(id_token.split('.')[1], 'base64url').toString('utf-8')
    )
    customerEmail = payload.email ?? ''
    // sub: "gid://shopify/Customer/9168135094500" → "9168135094500"
    const sub: string = payload.sub ?? ''
    customerId = sub.split('/').pop() ?? ''
  } catch { /* 디코딩 실패 시 무시 */ }

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
      httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
    })
  }
  if (customerId) {
    response.cookies.set('customer_id', customerId, {
      httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
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
