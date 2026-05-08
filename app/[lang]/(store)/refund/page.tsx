import { notFound } from 'next/navigation'
import { hasLocale } from '../../dictionaries'

type Props = { params: Promise<{ lang: string }> }

const content = {
  ko: {
    title: '환불정책',
    body: `
## 청약철회 (환불 신청)
상품 수령일로부터 **7일 이내**에 교환·반품 신청이 가능합니다(전자상거래 등에서의 소비자보호에 관한 법률 제17조).

## 교환·반품 신청 방법
홈페이지 내 **고객 게시판** 또는 **채널톡**으로 아래 내용을 남겨주세요.
- 주문번호
- 교환·반품 사유
- 상품 상태 사진

## 반품 불가 사유
다음의 경우 반품·교환이 불가합니다.
- 착용, 세탁, 수선 등으로 상품 가치가 훼손된 경우
- 이용자의 과실로 상품이 손상된 경우
- 수령 후 7일이 경과한 경우
- 상품 및 구성품의 일부가 누락된 경우

## 반품 배송비
- 단순 변심: 반품 배송비 고객 부담 (편도 3,000원)
- 상품 불량·오배송: 반품 배송비 회사 부담

## 배송비 정책
- 기본 배송비: 3,000원
- 80,000원 이상 구매 시 무료배송

## 환불 처리
반품 상품 확인 후 **3~5 영업일** 이내에 환불 처리됩니다.
- 신용카드 결제: 카드사 영업일 기준 3~5일 소요
- 계좌이체: 영업일 기준 1~3일 소요

## 문의
고객 게시판 또는 채널톡을 통해 문의해주세요.
이메일: applebuttercollege.official@gmail.com
전화: 010-2339-8492
    `,
  },
  ja: {
    title: '返品・返金ポリシー',
    body: `
## 返品・交換について
商品到着後**7日以内**に未使用・未洗濯の状態であれば、返品・交換を承ります。

## 申請方法
サイト内のお問い合わせフォームにて以下をご連絡ください。
- ご注文番号
- 返品・交換の理由
- 商品の状態がわかる写真

## 返品不可の場合
以下の場合は返品・交換をお承りできません。
- 着用・洗濯・修理等により商品価値が損なわれた場合
- お客様の過失により商品が破損した場合
- 到着後7日を経過した場合
- 付属品・タグ等が欠損している場合

## 送料・返送料
- 基本送料：3,000ウォン / 80,000ウォン以上で送料無料
- お客様都合の返品：返送料はお客様負担
- 商品不良・誤送の場合：返送料は当社負担

## 返金処理
返品商品の確認後、**3〜5営業日**以内に返金処理いたします。

## お問い合わせ
applebuttercollege.official@gmail.com
    `,
  },
}

export default async function RefundPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const c = content[lang as 'ko' | 'ja']

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-lg font-semibold mb-8">{c.title}</h1>
      <div className="prose prose-sm text-ink-muted max-w-none [&_h2]:text-ink [&_h2]:font-medium [&_h2]:text-sm [&_h2]:mt-8 [&_h2]:mb-2">
        {c.body.trim().split('\n').map((line, i) => {
          if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>
          if (line.startsWith('- ')) return <p key={i} className="ml-4">· {line.slice(2)}</p>
          if (line === '') return <br key={i} />
          return <p key={i}>{line}</p>
        })}
      </div>
    </section>
  )
}
