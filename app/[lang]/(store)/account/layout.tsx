import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../dictionaries'
import AccountNav from '@/components/account/AccountNav'

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) redirect('/')

  // 로그인 게이트 — 미로그인 시 OIDC 로그인으로. (dev는 로컬 OIDC 불가라 통과)
  if (process.env.NODE_ENV !== 'development') {
    const cookieStore = await cookies()
    const token = cookieStore.get('customer_token')?.value
    if (!token) redirect(`/api/auth/login?redirect=/${lang}/account`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div className="mb-10 pb-8 border-b border-border">
        {/* 단일 영문 타이틀 — eyebrow/국문 중복 제거(브랜드 영문 톤). 네비·프로필카드가 맥락 제공 */}
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight">Account</h1>
      </div>
      <AccountNav lang={lang} />
      {children}
    </div>
  )
}
