'use client'

import { useState, useTransition } from 'react'
import { createQuestion } from '@/lib/actions/qa'
import type { Locale } from '@/lib/shopify/types'

const t: Record<Locale, {
  category: string; titleLabel: string; content: string
  orderNumber: string; orderNumberRequired: string
  orderNumberHint: string; orderNumberHintRequired: string
  isPrivate: string; isPrivateHint: string
  submit: string
  categories: Record<string, string>
  returnIntercept: { heading: string; body: string; cta: string }
}> = {
  ko: {
    category: '분류', titleLabel: '제목', content: '문의 내용',
    orderNumber: '주문번호 (선택)', orderNumberRequired: '주문번호 (필수)',
    orderNumberHint: '관련 주문번호가 있으면 입력해주세요',
    orderNumberHintRequired: '주문번호를 입력해야 처리가 가능합니다',
    isPrivate: '비공개 문의', isPrivateHint: '비공개 설정 시 본인만 확인 가능합니다',
    submit: '문의 등록',
    categories: { shipping: '배송', return: '교환/반품', refund: '환불', product: '상품', other: '기타' },
    returnIntercept: {
      heading: '반품 신청은 전용 폼을 이용해주세요',
      body: '계좌 정보 등 개인정보를 안전하게 처리하기 위해 전용 반품 신청 페이지를 운영하고 있습니다. 게시판 문의로는 반품 처리가 진행되지 않습니다.',
      cta: '반품 신청 폼으로 이동 →',
    },
  },
  ja: {
    category: 'カテゴリ', titleLabel: 'タイトル', content: 'お問い合わせ内容',
    orderNumber: '注文番号 (任意)', orderNumberRequired: '注文番号 (必須)',
    orderNumberHint: '関連する注文番号がある場合はご入力ください',
    orderNumberHintRequired: '注文番号がないとご対応できない場合があります',
    isPrivate: '非公開', isPrivateHint: '非公開にすると、ご本人のみ確認できます',
    submit: '送信する',
    categories: { shipping: '配送', return: '交換・返品', refund: '返金', product: '商品', other: 'その他' },
    returnIntercept: {
      heading: '交換・返品は専用フォームよりお申し込みください',
      body: '個人情報（口座情報など）を安全に処理するため、専用の返品申請ページをご利用いただいております。掲示板でのご連絡では返品処理は行われません。',
      cta: '返品申請フォームへ →',
    },
  },
  en: {
    category: 'Category', titleLabel: 'Title', content: 'Message',
    orderNumber: 'Order number (optional)', orderNumberRequired: 'Order number (required)',
    orderNumberHint: 'Enter your order number if relevant',
    orderNumberHintRequired: 'Required so we can look up your order',
    isPrivate: 'Private question', isPrivateHint: 'Only you and our team can see this',
    submit: 'Submit',
    categories: { shipping: 'Shipping', return: 'Exchange/Return', refund: 'Refund', product: 'Product', other: 'Other' },
    returnIntercept: {
      heading: 'Please use the dedicated returns form',
      body: 'Return requests must be submitted via our dedicated form to securely handle your bank account details. Requests posted here cannot be processed.',
      cta: 'Go to Returns Form →',
    },
  },
}

export default function NewQuestionForm({ lang }: { lang: Locale }) {
  const labels = t[lang]
  const [category, setCategory] = useState('shipping')
  const [pending, startTransition] = useTransition()

  const isReturn = category === 'return'
  const orderRequired = category === 'shipping' || category === 'refund'

  return (
    <form
      action={(fd) => startTransition(() => createQuestion(fd))}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="lang" value={lang} />

      {/* 분류 */}
      <div>
        <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted block mb-2">
          {labels.category}
        </label>
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:border-ink transition-colors"
        >
          {Object.entries(labels.categories).map(([key, val]) => (
            <option key={key} value={key}>{val}</option>
          ))}
        </select>
      </div>

      {/* 교환/반품 인터셉트 */}
      {isReturn && (
        <div className="border border-border rounded-xl p-6 bg-surface flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold mb-2">{labels.returnIntercept.heading}</p>
            <p className="text-xs text-ink-muted leading-relaxed">{labels.returnIntercept.body}</p>
          </div>
          <a
            href={`/${lang}/returns`}
            className="inline-flex items-center justify-center py-3 px-6 bg-ink text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {labels.returnIntercept.cta}
          </a>
        </div>
      )}

      {/* 나머지 폼 필드 — 교환/반품 선택 시 숨김 */}
      {!isReturn && (
        <>
          <div>
            <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted block mb-2">
              {labels.titleLabel}
            </label>
            <input
              type="text" name="title" required maxLength={200}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink transition-colors"
              placeholder={labels.titleLabel}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted block mb-2">
              {labels.content}
            </label>
            <textarea
              name="content" required rows={6}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink transition-colors resize-none"
              placeholder={labels.content}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted block mb-2">
              {orderRequired ? labels.orderNumberRequired : labels.orderNumber}
            </label>
            <input
              type="text" name="order_number"
              required={orderRequired}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink transition-colors"
              placeholder={orderRequired ? labels.orderNumberHintRequired : labels.orderNumberHint}
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox" name="is_private" value="true"
              className="mt-0.5 w-4 h-4 rounded border-border accent-ink"
            />
            <div>
              <p className="text-sm">{labels.isPrivate}</p>
              <p className="text-xs text-ink-muted mt-0.5">{labels.isPrivateHint}</p>
            </div>
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 bg-ink text-white rounded-lg text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity mt-2"
          >
            {pending ? '...' : labels.submit}
          </button>
        </>
      )}
    </form>
  )
}
