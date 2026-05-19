import { notFound } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'

type FaqItem = { q: string; a: string | string[] }
type FaqSection = { title: string; items: FaqItem[] }

const content: Record<Locale, { title: string; sections: FaqSection[] }> = {
  ko: {
    title: '자주 묻는 질문',
    sections: [
      {
        title: '주문 · 결제',
        items: [
          {
            q: '무통장 입금 후 미입금 시 어떻게 되나요?',
            a: [
              '주문 후 1시간 이내 미입금 시 자동 취소됩니다.',
              '입금자명과 주문자명이 동일해야 하며, 주문금액과 입금금액이 일치해야 결제가 완료됩니다.',
              '입금 후 취소를 원하시면 이메일로 문의해 주세요.',
            ],
          },
          {
            q: '사이즈 변경이 가능한가요?',
            a: '사이즈 변경은 주문 취소 후 재주문해 주셔야 합니다. 배송 준비 중 상태로 변경된 이후에는 취소가 어려우니 신중히 주문해 주세요.',
          },
          {
            q: '현금영수증 발급이 가능한가요?',
            a: '구매 후 1주일 이내에 발급받으실 번호를 이메일로 보내주시면 처리해 드립니다.',
          },
        ],
      },
      {
        title: '배송',
        items: [
          {
            q: '배송비는 얼마인가요?',
            a: [
              '기본 배송비: 3,500원',
              '80,000원 이상 구매 시 무료',
              '제주: +3,000원 / 제주 외 도서산간: +4,000원 추가',
            ],
          },
          {
            q: '합배송이 가능한가요?',
            a: '배송일이 다른 상품은 합배송이 불가합니다. 먼저 받고 싶은 상품이 있을 경우 각각 따로 주문해 주세요.',
          },
          {
            q: '배송 주소 변경이 가능한가요?',
            a: '배송 준비 전까지 이메일 또는 채팅으로 문의해 주시면 변경을 도와드립니다.',
          },
        ],
      },
      {
        title: '반품 · 교환',
        items: [
          {
            q: '반품은 어떻게 신청하나요?',
            a: [
              '상품 수령 후 7일 이내에 반품 신청 페이지를 이용해 주세요.',
              '접수 완료 후 방문 수거를 도와드립니다. 상품을 직접 발송하지 마세요.',
            ],
          },
          {
            q: '반품 배송비는 누가 부담하나요?',
            a: '단순 변심·사이즈 미스의 경우 고객 부담, 불량·오배송의 경우 저희가 부담합니다.',
          },
          {
            q: '반품이 불가한 경우가 있나요?',
            a: [
              '태그(TAG)를 제거한 경우',
              '착용·세탁·수선 등으로 상품 가치가 훼손된 경우',
              '수령 후 7일이 경과한 경우',
            ],
          },
          {
            q: '교환은 어떻게 하나요?',
            a: '교환은 별도로 운영하지 않습니다. 반품 신청 후 환불을 받으신 다음 원하시는 상품을 새로 주문해 주세요.',
          },
        ],
      },
      {
        title: '상품 · 세탁',
        items: [
          {
            q: '사이즈는 어떻게 선택하나요?',
            a: [
              'XS — 80cm / 약 11kg',
              'S — 85cm / 약 12kg',
              'M — 90cm / 약 13kg',
              'L — 100cm / 약 16kg',
              'XL — 110cm / 약 20kg',
              '상품 페이지의 사이즈 가이드도 함께 참고해 주세요.',
            ],
          },
          {
            q: '세탁은 어떻게 해야 하나요?',
            a: '뒤집어서 세탁해 주세요. 표백제 사용은 피해 주세요.',
          },
          {
            q: '아동복 안전성 검사를 받은 제품인가요?',
            a: '네, 모든 제품은 아동용 의류 안전성 검사를 완료하였습니다.',
          },
          {
            q: '품절된 상품은 재입고 되나요?',
            a: '원단 소진 시 재입고가 어려울 수 있습니다. 재입고 문의는 이메일 또는 채팅으로 남겨주세요.',
          },
        ],
      },
      {
        title: 'CS 안내',
        items: [
          {
            q: '고객센터 운영 시간은 어떻게 되나요?',
            a: [
              '운영 시간: 월–금 12:00 – 16:00',
              '주말 · 공휴일 휴무',
              '전화 상담은 운영하지 않습니다. 이메일 또는 채팅으로 문의해 주세요.',
            ],
          },
        ],
      },
    ],
  },
  ja: {
    title: 'よくある質問',
    sections: [
      {
        title: 'ご注文・お支払い',
        items: [
          {
            q: '銀行振込で未入金の場合はどうなりますか？',
            a: [
              'ご注文後1時間以内にご入金がない場合、自動キャンセルとなります。',
              '振込名義はご注文者名と同一である必要があります。',
              'ご入金後のキャンセルはメールにてお問い合わせください。',
            ],
          },
          {
            q: 'サイズ変更はできますか？',
            a: 'サイズ変更はキャンセル後に再注文していただく必要があります。発送準備中の場合はキャンセルが難しいため、ご注文の際は十分にご確認ください。',
          },
        ],
      },
      {
        title: '配送',
        items: [
          {
            q: '送料はいくらですか？',
            a: '別途ご案内いたします。',
          },
          {
            q: 'まとめ配送はできますか？',
            a: '発送日が異なる商品のまとめ配送はできません。別々にご注文ください。',
          },
        ],
      },
      {
        title: '返品・交換',
        items: [
          {
            q: '返品はどのように申請しますか？',
            a: [
              '商品受取後7日以内に返品申請ページよりお申し込みください。',
              '受付後、集荷手配をお手伝いします。直接発送はしないでください。',
            ],
          },
          {
            q: '返品送料は誰が負担しますか？',
            a: 'お客様都合・サイズミスの場合はお客様負担、不良品・誤配送の場合は当店負担となります。',
          },
          {
            q: '返品できない場合はありますか？',
            a: [
              'タグを取り外した場合',
              '着用・洗濯・修繕等により商品の価値が損なわれた場合',
              '受取後7日を経過した場合',
            ],
          },
          {
            q: '交換はできますか？',
            a: '交換は承っておりません。返品・返金後に改めてご注文ください。',
          },
        ],
      },
      {
        title: '商品・洗濯',
        items: [
          {
            q: 'サイズの選び方を教えてください。',
            a: [
              'XS — 80cm / 約11kg',
              'S — 85cm / 約12kg',
              'M — 90cm / 約13kg',
              'L — 100cm / 約16kg',
              'XL — 110cm / 約20kg',
            ],
          },
          {
            q: '洗濯方法を教えてください。',
            a: '裏返して洗濯してください。漂白剤のご使用はお避けください。',
          },
        ],
      },
      {
        title: 'カスタマーサポート',
        items: [
          {
            q: 'サポート受付時間はいつですか？',
            a: [
              '受付時間：月〜金 12:00〜16:00',
              '土日・祝日休み',
              'お電話でのご対応はしておりません。メールまたはチャットにてお問い合わせください。',
            ],
          },
        ],
      },
    ],
  },
  en: {
    title: 'FAQ',
    sections: [
      {
        title: 'Orders & Payment',
        items: [
          {
            q: 'What happens if I don\'t complete a bank transfer?',
            a: 'Orders paid by bank transfer will be automatically cancelled if payment is not received within 1 hour.',
          },
          {
            q: 'Can I change my size after ordering?',
            a: 'Size changes are not possible after ordering. Please cancel and place a new order. Note that cancellation may not be possible once the order is in the shipping preparation stage.',
          },
        ],
      },
      {
        title: 'Shipping',
        items: [
          {
            q: 'Can I combine multiple orders into one shipment?',
            a: 'Items with different shipping dates cannot be combined. Please place separate orders if you\'d like items shipped earlier.',
          },
        ],
      },
      {
        title: 'Returns',
        items: [
          {
            q: 'How do I request a return?',
            a: [
              'Submit a return request within 7 days of receiving your order.',
              'We will arrange a pickup after your request is confirmed. Please do not ship the item yourself.',
            ],
          },
          {
            q: 'Who pays for return shipping?',
            a: 'Return shipping is the customer\'s responsibility for change-of-mind returns. We cover shipping costs for defective or incorrectly shipped items.',
          },
          {
            q: 'Do you offer exchanges?',
            a: 'We do not offer direct exchanges. Please return the item and place a new order for the size or item you want.',
          },
        ],
      },
      {
        title: 'Products & Care',
        items: [
          {
            q: 'How do I choose the right size?',
            a: [
              'XS — 80cm / ~11kg',
              'S — 85cm / ~12kg',
              'M — 90cm / ~13kg',
              'L — 100cm / ~16kg',
              'XL — 110cm / ~20kg',
            ],
          },
          {
            q: 'How should I wash the clothes?',
            a: 'Wash inside out. Avoid bleach.',
          },
        ],
      },
      {
        title: 'Customer Support',
        items: [
          {
            q: 'What are your support hours?',
            a: [
              'Mon–Fri 12:00–16:00 KST',
              'Closed on weekends and public holidays',
              'We do not offer phone support. Please contact us via email or chat.',
            ],
          },
        ],
      },
    ],
  },
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale
  const { title, sections } = content[locale]

  return (
    <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
      <h1 className="text-sm font-bold tracking-widest uppercase mb-10">{title}</h1>
      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-4 pb-2 border-b border-border">
              {section.title}
            </h2>
            <div className="flex flex-col">
              {section.items.map((item) => (
                <details key={item.q} className="group border-b border-border last:border-b-0">
                  <summary className="list-none flex items-center justify-between py-4 cursor-pointer select-none gap-4">
                    <span className="text-sm font-medium">{item.q}</span>
                    <svg
                      width="12" height="12" viewBox="0 0 12 12"
                      className="shrink-0 transition-transform duration-200 group-open:rotate-180"
                    >
                      <path d="M1 4 L6 8 L11 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </summary>
                  <div className="pb-4 text-sm text-ink-muted leading-relaxed">
                    {Array.isArray(item.a) ? (
                      <ul className="flex flex-col gap-1">
                        {item.a.map((line, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="shrink-0 text-ink-muted/50">—</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{item.a}</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
