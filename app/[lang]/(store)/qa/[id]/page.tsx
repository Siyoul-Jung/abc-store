import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { hasLocale } from '../../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'
import { getQuestion } from '@/lib/actions/qa'

const t: Record<Locale, {
  back: string; pending: string; answered: string
  categories: Record<string, string>
  answerTitle: string; noAnswer: string; privateLabel: string
}> = {
  ko: {
    back: '← 고객센터',
    pending: '답변대기', answered: '답변완료',
    categories: { shipping: '배송', return: '교환/반품', refund: '환불', product: '상품', other: '기타' },
    answerTitle: '답변', noAnswer: '아직 답변이 등록되지 않았습니다. 빠르게 처리해 드리겠습니다.',
    privateLabel: '비공개 문의',
  },
  ja: {
    back: '← カスタマーセンター',
    pending: '回答待ち', answered: '回答済み',
    categories: { shipping: '配送', return: '交換・返品', refund: '返金', product: '商品', other: 'その他' },
    answerTitle: '回答', noAnswer: 'まだ回答が登録されていません。',
    privateLabel: '非公開',
  },
  en: {
    back: '← Support',
    pending: 'Pending', answered: 'Answered',
    categories: { shipping: 'Shipping', return: 'Exchange/Return', refund: 'Refund', product: 'Product', other: 'Other' },
    answerTitle: 'Answer', noAnswer: "We haven't answered yet. We'll get back to you soon.",
    privateLabel: 'Private',
  },
}

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale
  const labels = t[locale]

  const question = await getQuestion(id)
  if (!question) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value
  if (!token) redirect(`/api/auth/login?redirect=/${lang}/qa/${id}`)
  const data = await caQuery<{ customer: { id: string } }>(token, `{ customer { id } }`)
  if (data?.customer?.id !== question.customer_id) notFound()

  const answer = question.answers?.[0]
  const dateStr = new Date(question.created_at).toLocaleDateString(
    locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : 'en-US'
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <a href={`/${lang}/qa`} className="text-sm text-ink-muted hover:text-ink transition-colors">{labels.back}</a>

      <div className="mt-8 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-ink-muted">
            {labels.categories[question.category] ?? question.category}
          </span>
          {question.is_private && (
            <span className="text-[10px] text-ink-muted">🔒 {labels.privateLabel}</span>
          )}
          <span className={`text-[11px] font-medium ml-auto ${question.status === 'answered' ? 'text-coral' : 'text-ink-muted'}`}>
            {labels[question.status as 'pending' | 'answered']}
          </span>
        </div>
        <h1 className="text-lg font-semibold mb-1 break-keep">{question.title}</h1>
        <p className="text-xs text-ink-muted">{question.customer_name} · {dateStr}</p>
      </div>

      {/* 질문 내용 */}
      <div className="bg-surface rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap mb-6">
        {question.content}
      </div>

      {/* 답변 */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-3">{labels.answerTitle}</p>
        {answer ? (
          <div className="border border-border rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap">
            {answer.content}
          </div>
        ) : (
          <p className="text-sm text-ink-muted py-6 text-center border border-dashed border-border rounded-xl">
            {labels.noAnswer}
          </p>
        )}
      </div>
    </div>
  )
}
