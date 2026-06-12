import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import { caQuery } from '@/lib/shopify/customer-account'
import { getMyQuestions } from '@/lib/actions/qa'

const t: Record<Locale, {
  title: string; subtitle: string; write: string
  categories: Record<string, string>
  status: Record<string, string>
  myTitle: string; privateLabel: string
  notice: { text: string; link: string; exchange: string }
}> = {
  ko: {
    title: '고객센터',
    subtitle: '궁금한 점이나 불편사항을 남겨주세요. 빠르게 답변 드리겠습니다.',
    write: '1:1 문의',
    categories: { shipping: '배송', return: '교환/반품', refund: '환불', product: '상품', other: '기타' },
    status: { pending: '답변대기', answered: '답변완료' },
    myTitle: '내 문의',
    privateLabel: '비공개',
    notice: {
      text: '교환·반품은 전용 신청 폼을 이용해주세요.',
      link: '반품 신청 →',
      exchange: '교환을 원하시는 경우, 반품 후 재구매해주세요.',
    },
  },
  ja: {
    title: 'カスタマーセンター',
    subtitle: 'ご不明な点やご不満がございましたら、お気軽にお問い合わせください。',
    write: '1:1 お問い合わせ',
    categories: { shipping: '配送', return: '交換・返品', refund: '返金', product: '商品', other: 'その他' },
    status: { pending: '回答待ち', answered: '回答済み' },
    myTitle: 'マイお問い合わせ',
    privateLabel: '非公開',
    notice: {
      text: '交換・返品は専用フォームよりお申し込みください。',
      link: '返品申請 →',
      exchange: '交換をご希望の場合は、返品後に再度ご購入ください。',
    },
  },
  en: {
    title: 'Customer Support',
    subtitle: 'Have a question? We\'re here to help.',
    write: 'Ask a question',
    categories: { shipping: 'Shipping', return: 'Exchange/Return', refund: 'Refund', product: 'Product', other: 'Other' },
    status: { pending: 'Pending', answered: 'Answered' },
    myTitle: 'My questions',
    privateLabel: 'Private',
    notice: {
      text: 'For exchanges or returns, please use our dedicated form.',
      link: 'Return request →',
      exchange: 'For exchanges, please return the item and place a new order.',
    },
  },
}

export default async function QaPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale
  const labels = t[locale]

  // 비회원도 접근 가능 — 로그인 고객은 "내 문의" 목록을 함께 본다.
  const cookieStore = await cookies()
  const token = cookieStore.get('customer_token')?.value

  let customerId: string | null = null
  if (token) {
    const data = await caQuery<{ customer: { id: string } }>(token, `{ customer { id } }`)
    customerId = data?.customer?.id ?? null
  }

  const myQs = customerId ? await getMyQuestions(customerId) : []

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">

      {/* 헤더 */}
      <div className="mb-10">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight mb-2 break-keep">{labels.title}</h1>
        <p className="text-sm text-ink-muted">{labels.subtitle}</p>
      </div>

      {/* 교환/반품 안내 공지 */}
      <div className="mb-8 px-4 py-4 bg-surface border border-border rounded-xl text-sm flex flex-col gap-1.5">
        <p className="text-ink">{labels.notice.exchange}</p>
        <p className="text-ink-muted">
          {labels.notice.text}{' '}
          <Link href={`/${lang}/returns`} className="text-ink underline underline-offset-4 hover:opacity-60 transition-opacity">
            {labels.notice.link}
          </Link>
        </p>
      </div>

      {/* 내 문의 */}
      {myQs.length > 0 && (
        <section className="mb-8">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-3">{labels.myTitle}</p>
          <div className="border-t border-border">
            {myQs.map((q) => (
              <Link key={q.id} href={`/${lang}/qa/${q.id}`}
                className="flex items-start justify-between py-4 border-b border-border hover:bg-surface/50 -mx-2 px-2 rounded transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-ink-muted">
                      {labels.categories[q.category as string] ?? q.category}
                    </span>
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

      {/* 문의 작성 버튼 */}
      <div className="flex justify-end">
        <Link href={`/${lang}/qa/new`}
          className="text-xs px-4 py-2 bg-ink text-white rounded-full hover:opacity-75 transition-opacity">
          {labels.write} →
        </Link>
      </div>

    </div>
  )
}
