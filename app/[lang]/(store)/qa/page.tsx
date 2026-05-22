import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'
import { getPublicQuestions, getMyQuestions } from '@/lib/actions/qa'
import type { QuestionCategory } from '@/lib/supabase/types'

const t: Record<Locale, {
  title: string; subtitle: string; write: string
  categories: Record<string, string>
  status: Record<string, string>
  empty: string; myTitle: string; privateLabel: string
}> = {
  ko: {
    title: '고객센터',
    subtitle: '궁금한 점이나 불편사항을 남겨주세요. 빠르게 답변 드리겠습니다.',
    write: '문의 작성',
    categories: { all: '전체', shipping: '배송', return: '교환/반품', refund: '환불', product: '상품', other: '기타' },
    status: { pending: '답변대기', answered: '답변완료' },
    empty: '등록된 문의가 없습니다.',
    myTitle: '내 문의',
    privateLabel: '비공개',
  },
  ja: {
    title: 'カスタマーセンター',
    subtitle: 'ご不明な点やご不満がございましたら、お気軽にお問い合わせください。',
    write: 'お問い合わせ',
    categories: { all: 'すべて', shipping: '配送', return: '交換・返品', refund: '返金', product: '商品', other: 'その他' },
    status: { pending: '回答待ち', answered: '回答済み' },
    empty: 'お問い合わせはありません。',
    myTitle: 'マイお問い合わせ',
    privateLabel: '非公開',
  },
  en: {
    title: 'Customer Support',
    subtitle: 'Have a question? We\'re here to help.',
    write: 'Ask a question',
    categories: { all: 'All', shipping: 'Shipping', return: 'Exchange/Return', refund: 'Refund', product: 'Product', other: 'Other' },
    status: { pending: 'Pending', answered: 'Answered' },
    empty: 'No questions yet.',
    myTitle: 'My questions',
    privateLabel: 'Private',
  },
}

const categoryKeys = ['all', 'shipping', 'return', 'refund', 'product', 'other']

export default async function QaPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const { lang } = await params
  const { category = 'all' } = await searchParams
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale
  const labels = t[locale]

  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  // 고객 정보 조회
  let customerId: string | null = null
  if (token) {
    const data = await caQuery<{ customer: { id: string } }>(token, `{ customer { id } }`)
    customerId = data?.customer?.id ?? null
  }

  const [publicQs, myQs] = await Promise.all([
    getPublicQuestions(category),
    customerId ? getMyQuestions(customerId) : Promise.resolve([]),
  ])

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">

      {/* 헤더 */}
      <div className="mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-2">{labels.title}</h1>
        <p className="text-sm text-ink-muted">{labels.subtitle}</p>
      </div>

      {/* 내 문의 (로그인 시) */}
      {myQs.length > 0 && (
        <section className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-3">{labels.myTitle}</p>
          <div className="border-t border-border">
            {myQs.map((q) => (
              <Link key={q.id} href={`/${lang}/qa/${q.id}`}
                className="flex items-start justify-between py-4 border-b border-border hover:bg-surface/50 -mx-2 px-2 rounded transition-colors group">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-muted">
                      {labels.categories[q.category as string] ?? q.category}
                    </span>
                    {q.is_private && (
                      <span className="text-[10px] text-ink-muted">🔒 {labels.privateLabel}</span>
                    )}
                  </div>
                  <p className="text-sm truncate">{q.title}</p>
                </div>
                <span className={`text-[11px] shrink-0 ml-4 mt-0.5 font-medium ${q.status === 'answered' ? 'text-coral' : 'text-ink-muted'}`}>
                  {labels.status[q.status]}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 카테고리 필터 + 작성 버튼 */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {categoryKeys.map((key) => (
            <Link key={key} href={`/${lang}/qa${key === 'all' ? '' : `?category=${key}`}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                category === key || (key === 'all' && category === 'all')
                  ? 'border-ink bg-ink text-white'
                  : 'border-border text-ink-muted hover:border-ink-muted'
              }`}>
              {labels.categories[key]}
            </Link>
          ))}
        </div>
        <Link href={`/${lang}/qa/new`}
          className="text-xs px-4 py-2 bg-ink text-white rounded-full hover:opacity-75 transition-opacity shrink-0">
          {labels.write} →
        </Link>
      </div>

      {/* 공개 Q&A 목록 */}
      <div className="border-t border-border">
        {publicQs.length === 0 ? (
          <p className="text-sm text-ink-muted py-12 text-center">{labels.empty}</p>
        ) : (
          publicQs.map((q) => (
            <Link key={q.id} href={`/${lang}/qa/${q.id}`}
              className="flex items-start justify-between py-4 border-b border-border hover:bg-surface/50 -mx-2 px-2 rounded transition-colors">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-muted mr-2">
                  {labels.categories[q.category as string] ?? q.category}
                </span>
                <span className="text-sm">{q.title}</span>
              </div>
              <span className="text-[11px] text-coral shrink-0 ml-4 mt-0.5 font-medium">
                {labels.status.answered}
              </span>
            </Link>
          ))
        )}
      </div>

    </div>
  )
}
