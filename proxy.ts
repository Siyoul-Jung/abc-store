import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SITE_URL } from '@/lib/utils/site'

// 운영 로케일은 ko/ja만. en 사전·타입은 나중(영어권 진출) 위해 보존하되 라우팅에선 미노출.
const locales = ['ko', 'ja'] as const
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

  // 임시 주소(*.vercel.app)로 들어온 페이지 요청은 공식 주소로 308 — 같은 사이트가 두 주소로 색인되는 것 방지.
  // 운영 배포만(프리뷰는 vercel.app이 본 주소). /api(크론·결제 콜백)는 matcher에서 이미 제외라 영향 없음.
  // SITE_URL이 vercel.app을 가리키면 무한 리다이렉트가 되므로 호스트가 다를 때만.
  const host = request.headers.get('host') ?? ''
  if (process.env.VERCEL_ENV === 'production' && host.endsWith('.vercel.app') && new URL(SITE_URL).host !== host) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, SITE_URL), 308)
  }

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

  // en 미운영(ko/ja만) — /en/* 는 감지 로케일로 정규화. 깨진 영어 페이지(라벨 일부 일본어) 노출 차단.
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const url = request.nextUrl.clone()
    url.pathname = `/${getLocale(request)}${pathname.slice(3)}`  // '/en' 이후 경로 유지
    return NextResponse.redirect(url)
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
