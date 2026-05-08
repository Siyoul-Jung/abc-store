import { notFound } from 'next/navigation'
import Link from 'next/link'
import { hasLocale } from '../../../dictionaries'

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ message?: string; code?: string }>
}

export default async function CheckoutFailPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const { message } = await searchParams

  return (
    <section className="max-w-lg mx-auto px-4 py-24 text-center flex flex-col items-center gap-6">
      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-xl">
        ✕
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-base font-semibold">결제에 실패했습니다</h1>
        {message && <p className="text-sm text-ink-muted">{message}</p>}
      </div>
      <Link
        href={`/${lang}/checkout`}
        className="text-sm underline underline-offset-4 text-ink-muted hover:text-ink transition-colors"
      >
        다시 시도하기
      </Link>
    </section>
  )
}
