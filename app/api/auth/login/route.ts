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
  const redirectTo = searchParams.get('redirect') ?? '/'

  const state = crypto.randomBytes(16).toString('hex')
  const nonce = crypto.randomBytes(16).toString('hex')
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest())

  const cookieStore = await cookies()
  const opts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 300 }
  cookieStore.set('_auth_state', state, opts)
  cookieStore.set('_auth_verifier', verifier, opts)
  cookieStore.set('_auth_redirect', redirectTo, opts)

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
