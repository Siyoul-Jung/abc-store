import { notFound } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import ReturnForm from '@/components/returns/ReturnForm'
import type { Locale } from '@/lib/shopify/types'

type Props = { params: Promise<{ lang: string }> }

export default async function ReturnsPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
      <div className="max-w-md mx-auto">
        <ReturnForm locale={lang as Locale} />
      </div>
    </div>
  )
}
