import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['ko', 'ja'] as const
const defaultLocale = 'ko'

function getLocale(request: NextRequest): string {
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
