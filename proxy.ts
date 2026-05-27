import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['ko', 'ja', 'en'] as const
const defaultLocale = 'ko'
const COOKIE_NAME = 'lang'

function getLocale(request: NextRequest): string {
  // 1. 쿠키 우선 (수동 선택 기억)
  const cookie = request.cookies.get(COOKIE_NAME)?.value
  if (cookie && (locales as readonly string[]).includes(cookie)) return cookie

  // 2. Vercel geo (국가 기반)
  const country = (request as NextRequest & { geo?: { country?: string } }).geo?.country
  if (country === 'JP') return 'ja'
  if (country === 'KR') return 'ko'

  // 3. Accept-Language 헤더
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  const preferred = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
  return (locales as readonly string[]).includes(preferred) ? preferred : defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /coming-soon (locale 포함 변형 포함) 항상 통과 또는 /coming-soon으로 정규화
  if (pathname === '/coming-soon') return
  if (locales.some(l => pathname === `/${l}/coming-soon`)) {
    return NextResponse.redirect(new URL('/coming-soon', request.url))
  }

  // Coming Soon 모드: 나머지 모든 경로를 /coming-soon으로 리다이렉트
  if (process.env.NEXT_PUBLIC_COMING_SOON === 'true') {
    return NextResponse.redirect(new URL('/coming-soon', request.url))
  }

  // 체크아웃 일시 중단: /ko/checkout, /ja/checkout → 카트로 리다이렉트
  if (process.env.CHECKOUT_PAUSED === 'true') {
    if (/^\/[a-z]{2}\/checkout$/.test(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = pathname.replace('/checkout', '/cart')
      url.searchParams.set('notice', 'checkout_paused')
      return NextResponse.redirect(url)
    }
  }

  // /admin 경로는 로케일 라우팅 제외
  if (pathname.startsWith('/admin')) return

  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (hasLocale) return

  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
}
