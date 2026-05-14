'use client'

import { useEffect } from 'react'
import type { Locale } from '@/lib/shopify/types'

const t = {
  ko: {
    title: '배송 · 교환·반품 안내',
    shipping: {
      heading: '배송 안내',
      items: [
        '배송비 3,500원 (80,000원 이상 구매 시 무료)',
        '제주 +3,000원 / 제주 외 도서산간 +4,000원 추가',
        '배송일이 다른 제품은 합배송 불가 — 각각 따로 주문해 주세요.',
        '배송준비 상태로 넘어간 경우 취소가 어렵습니다. 신중히 구매해 주세요.',
      ],
    },
    returns: {
      heading: '교환 · 반품 안내',
      items: [
        '교환 및 반품 접수는 상품 수령 후 7일 이내 교환·반품 신청 페이지를 이용해 주세요.',
        '접수 완료 시 배송비 안내 및 우체국 택배 회수를 도와드립니다.',
        'Tag 제거 시 교환·환불이 어렵습니다.',
        '유선 CS는 운영하지 않습니다.',
      ],
    },
    payment: {
      heading: '주문 · 결제 안내',
      items: [
        '무통장 입금은 1시간 이내 미입금 시 자동 취소됩니다.',
        '입금자와 주문자 성함이 동일해야 결제 완료 처리됩니다.',
        '주문금액과 입금금액이 일치해야 결제 완료됩니다.',
        '사이즈 변경은 취소 후 다시 결제해 주세요.',
      ],
    },
  },
  ja: {
    title: '配送・交換・返品について',
    shipping: {
      heading: '配送について',
      items: [
        '送料 ¥500（¥8,000以上で送料無料）',
        '離島・一部地域は追加送料が発生する場合があります。',
        '発送日が異なる商品は同梱不可です。別々にご注文ください。',
        '発送準備中の場合、キャンセルが難しい場合があります。',
      ],
    },
    returns: {
      heading: '交換・返品について',
      items: [
        '交換・返品は商品到着後7日以内に申請ページよりお手続きください。',
        '受付完了後、返送方法をご案内いたします。',
        'タグを取り外した商品の交換・返金はお受けできません。',
        'お電話でのCSは承っておりません。',
      ],
    },
    payment: {
      heading: 'ご注文・お支払いについて',
      items: [
        '銀行振込は1時間以内にご入金がない場合、自動キャンセルとなります。',
        'お振込名義はご注文者様のお名前と同一である必要があります。',
        'ご注文金額とご入金金額が一致している必要があります。',
        'サイズ変更はキャンセル後に再注文をお願いします。',
      ],
    },
  },
}

type Props = { locale: Locale; onClose: () => void }

export default function PolicyModal({ locale, onClose }: Props) {
  const l = t[locale]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const sections = [
    { key: 'shipping', data: l.shipping },
    { key: 'returns', data: l.returns },
    { key: 'payment', data: l.payment },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-lg w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
          <span className="text-sm font-bold tracking-widest uppercase">{l.title}</span>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-xl leading-none"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-8 pt-6">
          {sections.map(({ key, data }) => (
            <div key={key}>
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
                {data.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {data.items.map((item, i) => (
                  <li key={i} className="text-sm text-ink-muted leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
