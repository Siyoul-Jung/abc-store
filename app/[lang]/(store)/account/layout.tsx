import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'
import AccountNav from '@/components/account/AccountNav'

const NAME_QUERY = `{ customer { firstName lastName } }`

// locale별 인사 — 한/일은 성+이름 순서, 이름이 없으면 폴백
function greeting(locale: Locale, firstName: string, lastName: string): string {
  const hasName = Boolean(firstName || lastName)
  if (locale === 'en') {
    return hasName ? `Hi, ${[firstName, lastName].filter(Boolean).join(' ')}` : 'Welcome'
  }
  const full = `${lastName}${firstName}`.trim() || firstName || lastName
  if (locale === 'ja') return hasName ? `${full}様、こんにちは` : 'こんにちは'
  return hasName ? `안녕하세요, ${full}님` : '안녕하세요'
}

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

  const isDev = process.env.NODE_ENV === 'development'
  let firstName = ''
  let lastName = ''
  if (isDev) {
    firstName = '길동'
    lastName = '홍'
  } else {
    const cookieStore = await cookies()
    const token = cookieStore.get('customer_token')?.value
    if (!token) redirect(`/api/auth/login?redirect=/${lang}/account`)
    const data = await caQuery<{ customer: { firstName: string; lastName: string } | null }>(
      token,
      NAME_QUERY,
    )
    firstName = data?.customer?.firstName ?? ''
    lastName = data?.customer?.lastName ?? ''
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <div className="mb-10 pb-8 border-b border-border">
        <p className="font-display text-xs tracking-[0.3em] uppercase font-semibold text-coral mb-2">
          My Account
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight break-keep">
          {greeting(locale, firstName, lastName)}
        </h1>
      </div>
      <AccountNav lang={lang} />
      {children}
    </div>
  )
}
