import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const SHOP_ID = '78709162212'
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  // 오픈 리다이렉트 방어: 내부 경로(/로 시작, 프로토콜상대 //aaa 아님)만 허용.
  // new URL(redirectTo, origin)은 절대·프로토콜상대 URL이면 origin을 무시해 외부로 튕길 수 있다.
  const rawRedirect = searchParams.get('redirect') ?? '/'
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/'

  const state = crypto.randomBytes(16).toString('hex')
  const nonce = crypto.randomBytes(16).toString('hex')
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest())

  const cookieStore = await cookies()
  const opts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 300 }
  cookieStore.set('_auth_state', state, opts)
  cookieStore.set('_auth_verifier', verifier, opts)
  cookieStore.set('_auth_redirect', redirectTo, opts)
  // nonce를 저장해 콜백에서 id_token의 nonce와 대조한다(재생공격 방어).
  cookieStore.set('_auth_nonce', nonce, opts)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'openid email customer-account-api:full',
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: 'code',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  return NextResponse.redirect(
    `https://shopify.com/authentication/${SHOP_ID}/oauth/authorize?${params}`
  )
}
