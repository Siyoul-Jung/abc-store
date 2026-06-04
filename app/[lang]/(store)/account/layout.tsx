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

  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    const cookieStore = await cookies()
    const token = cookieStore.get('customer_token')?.value
    if (!token) redirect(`/api/auth/login?redirect=/${lang}/account`)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <div className="mb-10 pb-8 border-b border-border">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight break-keep">My Account</h1>
      </div>
      <AccountNav lang={lang} />
      {children}
    </div>
  )
}
