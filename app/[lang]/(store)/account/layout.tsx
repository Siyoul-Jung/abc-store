import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import AccountNav from '@/components/account/AccountNav'

// 고정 타이틀 — 이름 personalization 제거(대부분 신원 이름이 비어 "안녕하세요" 폴백뿐이라
// 일관성·미니멀을 택함). 덕분에 매 페이지 고객 이름 조회(CA API)도 불필요해짐.
const title: Record<Locale, string> = { ko: '마이페이지', ja: 'マイページ', en: 'My Page' }

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) redirect('/')
  const locale = lang as Locale

  // 로그인 게이트 — 미로그인 시 OIDC 로그인으로. (dev는 로컬 OIDC 불가라 통과)
  if (process.env.NODE_ENV !== 'development') {
    const cookieStore = await cookies()
    const token = cookieStore.get('customer_token')?.value
    if (!token) redirect(`/api/auth/login?redirect=/${lang}/account`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div className="mb-10 pb-8 border-b border-border">
        <p className="font-display text-xs tracking-[0.3em] uppercase font-semibold text-coral mb-2">
          My Account
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight break-keep">
          {title[locale]}
        </h1>
      </div>
      <AccountNav lang={lang} />
      {children}
    </div>
  )
}
