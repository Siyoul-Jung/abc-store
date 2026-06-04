import { notFound } from 'next/navigation'
import Link from 'next/link'
import { hasLocale } from '../../dictionaries'

type Props = { params: Promise<{ lang: string }> }

type InlineItem = { text: string; link: { label: string; href: string } }
type Section = {
  title: string
  items: (string | InlineItem)[]
}

const content: Record<'ko' | 'ja', { title: string; sections: Section[] }> = {
  ko: {
    title: '환불정책',
    sections: [
      {
        title: '청약철회 (환불 신청)',
        items: [
          '상품 수령일로부터 7일 이내에 반품 신청이 가능합니다(전자상거래 등에서의 소비자보호에 관한 법률 제17조).',
          '교환은 별도로 처리하지 않으며, 반품 후 재주문을 안내드립니다.',
        ],
      },
      {
        title: '반품 신청 방법',
        items: [
          { text: '홈페이지 내 반품 신청 폼을 이용해 주세요.', link: { label: '신청하기 →', href: '/returns' } },
          '- 주문번호 및 반품 사유 입력',
          '- 상품 상태 사진 첨부 (불량·오배송의 경우)',
        ],
      },
      {
        title: '반품 불가 사유',
        items: [
          '- 착용, 세탁, 수선 등으로 상품 가치가 훼손된 경우',
          '- 고객 과실로 상품이 손상된 경우',
          '- 수령 후 7일이 경과한 경우',
          '- 상품 및 구성품(택, 부속품)의 일부가 누락된 경우',
        ],
      },
      {
        title: '반품 배송비',
        items: [
          '- 단순 변심: 반품 배송비 고객 부담 (편도 3,000원)',
          '- 상품 불량·오배송: 반품 배송비 회사 부담',
        ],
      },
      {
        title: '배송비 정책',
        items: [
          '- 기본 배송비: 3,500원',
          '- 80,000원 이상 구매 시 무료배송',
          '- 제주도: 추가 3,000원',
          '- 도서·산간 지역: 추가 4,000원',
        ],
      },
      {
        title: '환불 처리',
        items: [
          '반품 상품 수령 확인 후 3~5 영업일 이내에 환불 처리됩니다.',
          '- 카드 결제: 카드사 영업일 기준 3~5일 소요',
          '- 계좌이체: 영업일 기준 1~3일 소요',
        ],
      },
      {
        title: '문의',
        items: [{ text: '홈페이지 내 고객 게시판을 이용해 주세요.', link: { label: '게시판 →', href: '/qa' } }],
      },
    ],
  },
  ja: {
    title: '返品・返金ポリシー',
    sections: [
      {
        title: '返品・交換について',
        items: [
          '商品到着後7日以内に未使用・未洗濯の状態であれば、返品を承ります。',
          '交換は承っておりません。返品後に再度ご注文いただきますようお願いいたします。',
        ],
      },
      {
        title: '申請方法',
        items: [
          { text: 'サイト内の返品申請フォームよりお申し込みください。', link: { label: '申請フォーム →', href: '/returns' } },
          '- ご注文番号と返品理由の入力',
          '- 商品の状態がわかる写真の添付（不良品・誤送の場合）',
        ],
      },
      {
        title: '返品不可の場合',
        items: [
          '- 着用・洗濯・修理等により商品価値が損なわれた場合',
          '- お客様の過失により商品が破損した場合',
          '- 到着後7日を経過した場合',
          '- 付属品・タグ等が欠損している場合',
        ],
      },
      {
        title: '送料・返送料',
        items: [
          '- 基本送料：3,500ウォン（80,000ウォン以上で送料無料）',
          '- お客様都合の返品：返送料はお客様負担',
          '- 商品不良・誤送の場合：返送料は当社負担',
        ],
      },
      {
        title: '返金処理',
        items: ['返品商品の確認後、3〜5営業日以内に返金処理いたします。'],
      },
      {
        title: 'お問い合わせ',
        items: [{ text: 'サイト内のお問い合わせフォームよりご連絡ください。', link: { label: 'お問い合わせ →', href: '/qa' } }],
      },
    ],
  },
}

export default async function RefundPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const c = content[lang as 'ko' | 'ja']

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-lg font-semibold mb-10 break-keep">{c.title}</h1>
      <div className="flex flex-col gap-8">
        {c.sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-medium text-ink mb-2 break-keep">{section.title}</h2>
            <div className="flex flex-col gap-1">
              {section.items.map((item, i) => {
                if (typeof item === 'string') {
                  return (
                    <p key={i} className={`text-sm text-ink-muted leading-relaxed ${item.startsWith('- ') ? 'ml-3' : ''}`}>
                      {item.startsWith('- ') ? `· ${item.slice(2)}` : item}
                    </p>
                  )
                }
                return (
                  <p key={i} className="text-sm text-ink-muted leading-relaxed">
                    {item.text}{' '}
                    <Link href={`/${lang}${item.link.href}`}
                      className="text-ink underline underline-offset-4 hover:opacity-60 transition-opacity">
                      {item.link.label}
                    </Link>
                  </p>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
