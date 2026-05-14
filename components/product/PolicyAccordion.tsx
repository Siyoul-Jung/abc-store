'use client'

import { useState } from 'react'

const policies = [
  {
    title: '배송 안내',
    content: `• 배송비 3,500원 (80,000원 이상 구매 시 무료)
• 제주 +3,000원 / 제주 외 도서산간 +4,000원 추가
• 배송일이 다른 제품은 선배송·합배송 불가 — 각각 따로 주문해 주세요.
• 배송준비 상태로 넘어간 경우 취소가 어렵습니다. 신중히 구매해 주세요.`,
  },
  {
    title: '교환 · 반품 안내',
    content: `• 교환 및 반품 접수는 상품 수령 후 7일 이내 Q&A 게시판으로 연락해 주세요.
• 접수 완료 시 교환·반품 배송비 안내 및 우체국 택배 회수를 도와드립니다.
• Tag 제거 시 교환·환불이 어렵습니다.
• 유선 CS는 운영하지 않습니다.`,
  },
  {
    title: '주문 · 결제 안내',
    content: `• 무통장 입금은 1시간 이내 미입금 시 자동 취소됩니다.
• 입금자와 주문자 성함이 동일해야 결제 완료 처리됩니다.
• 주문금액과 입금금액이 일치해야 결제 완료됩니다.
• 사이즈 변경은 취소 후 다시 결제해 주세요.`,
  },
]

export default function PolicyAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="border-t border-border">
      {policies.map((policy, i) => (
        <div key={i} className="border-b border-border">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-sm font-medium text-left"
          >
            {policy.title}
            <span className="text-ink-muted text-lg leading-none">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div className="pb-5 text-sm text-ink-muted whitespace-pre-line leading-relaxed">
              {policy.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
