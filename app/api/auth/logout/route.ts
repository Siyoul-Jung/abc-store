import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SHOP_ID = '78709162212'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const lang = searchParams.get('lang') ?? 'ko'

  const cookieStore = await cookies()
  const idToken = cookieStore.get('customer_id_token')?.value

  const response = NextResponse.redirect(
    idToken
      ? `https://shopify.com/authentication/${SHOP_ID}/logout?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(`${origin}/${lang}`)}`
      : new URL(`/${lang}`, origin)
  )

  response.cookies.delete('customer_token')
  response.cookies.delete('customer_id_token')
  response.cookies.delete('customer_email')
  response.cookies.delete('customer_logged_in')

  return response
}
