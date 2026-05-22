import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import NewQuestionForm from './_components/NewQuestionForm'

const pageLabels: Record<Locale, { title: string; back: string }> = {
  ko: { title: '문의 작성', back: '← 고객센터' },
  ja: { title: 'お問い合わせ', back: '← カスタマーセンター' },
  en: { title: 'Ask a question', back: '← Support' },
}

export default async function NewQuestionPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale

  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value
  const isDev = process.env.NODE_ENV === 'development'

  if (!isDev && !token) redirect(`/api/auth/login?redirect=/${lang}/qa/new`)

  const labels = pageLabels[locale]

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <div className="mb-8">
        <a href={`/${lang}/qa`} className="text-sm text-ink-muted hover:text-ink transition-colors">{labels.back}</a>
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight mb-8">{labels.title}</h1>
      <NewQuestionForm lang={locale} />
    </div>
  )
}
