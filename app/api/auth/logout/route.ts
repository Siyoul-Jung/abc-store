import { NextResponse } from 'next/server'

const SHOP_ID = '78709162212'
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const lang = searchParams.get('lang') ?? 'ko'

  const postLogoutUri = encodeURIComponent(`${origin}/${lang}`)
  const logoutUrl = `https://shopify.com/authentication/${SHOP_ID}/logout?client_id=${CLIENT_ID}&post_logout_redirect_uri=${postLogoutUri}`

  const response = NextResponse.redirect(logoutUrl)
  response.cookies.delete('customer_token')
  response.cookies.delete('customer_logged_in')
  return response
}
