import { NextRequest, NextResponse } from 'next/server'

const LOCALES = ['ko', 'ja'] as const
const DEFAULT_LOCALE = 'ko'
const COOKIE_NAME = 'lang'

function detectLocale(req: NextRequest): string {
  // 1. 쿠키 우선 (수동 선택 기억)
  const cookie = req.cookies.get(COOKIE_NAME)?.value
  if (cookie && LOCALES.includes(cookie as typeof LOCALES[number])) return cookie

  // 2. Vercel geo (국가 기반)
  const country = (req as NextRequest & { geo?: { country?: string } }).geo?.country
  if (country === 'JP') return 'ja'
  if (country === 'KR') return 'ko'

  // 3. Accept-Language 헤더
  const accept = req.headers.get('accept-language') ?? ''
  const lang = accept.split(',')[0].split('-')[0].toLowerCase()
  if (LOCALES.includes(lang as typeof LOCALES[number])) return lang

  return DEFAULT_LOCALE
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 이미 locale prefix가 있으면 통과
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  )
  if (hasLocale) return NextResponse.next()

  // 정적 파일, API 등 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) return NextResponse.next()

  const locale = detectLocale(req)
  const url = req.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
