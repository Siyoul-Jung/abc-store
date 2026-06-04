import { notFound } from 'next/navigation'
import { hasLocale } from '../../dictionaries'

type Props = { params: Promise<{ lang: string }> }

const content = {
  ko: {
    title: '개인정보처리방침',
    body: `
주식회사 에이치에프에프에프(이하 '회사')는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 아래와 같이 개인정보처리방침을 운영합니다.

## 1. 수집하는 개인정보 항목
회사는 주문·결제·배송 처리를 위해 다음의 개인정보를 수집합니다.
- 필수: 성명, 연락처(전화번호), 배송지 주소, 이메일 주소
- 결제 정보: 결제수단 종류, 거래 식별번호 (카드번호 등 민감 정보는 PG사에서 직접 처리하며 회사는 보유하지 않습니다)

## 2. 개인정보 수집 및 이용 목적
- 주문 접수 및 결제 처리
- 상품 배송 및 배송 현황 안내
- 교환·반품·환불 처리
- 고객 문의 응대

## 3. 개인정보 보유 및 이용 기간
- 주문 정보: 계약 이행 완료 후 **5년** (전자상거래법 제6조)
- 소비자 불만 또는 분쟁처리 기록: **3년**
- 이용자가 수집·이용에 동의한 날로부터 위 기간까지 보유하며, 기간 경과 후 지체 없이 파기합니다.

## 4. 개인정보의 제3자 제공
회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 배송 업무 수행을 위해 아래와 같이 최소한의 정보를 제공합니다.
- 제공 받는 자: 택배사(CJ대한통운, 우체국 등)
- 제공 항목: 수령인 성명, 배송지 주소, 연락처
- 보유 기간: 배송 완료 후 즉시 파기

## 5. 개인정보 처리 위탁
회사는 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁합니다.
- 수탁사: 토스페이먼츠(주) / 위탁 업무: 결제 처리
- 수탁사: Shopify Inc. / 위탁 업무: 주문 및 재고 관리

## 6. 정보주체의 권리
이용자는 언제든지 아래 권리를 행사할 수 있습니다.
- 개인정보 열람·정정·삭제 요청
- 개인정보 처리 정지 요청

요청은 홈페이지 내 고객 게시판으로 접수하며, 10일 이내에 처리합니다.

## 7. 개인정보 보호책임자
- 성명: 구승범
- 이메일: applebuttercollege.official@gmail.com
- 전화: 010-2339-8492

## 8. 사업자 정보
- 상호: 주식회사 에이치에프에프에프
- 대표자: 구승범
- 사업자등록번호: 846-81-02489
- 통신판매업 신고번호: 제 2022-다산-1147 호
- 주소: 경기도 남양주시 다산순환로 20, 10층 제비에이 10-006호 (다산동)

## 9. 시행일
본 방침은 2025년 1월 1일부터 시행합니다.
    `,
  },
  ja: {
    title: 'プライバシーポリシー',
    body: `
株式会社HFFF（以下「当社」）は、お客様の個人情報を大切に扱い、以下のプライバシーポリシーに基づいて適切に管理します。

## 1. 収集する個人情報
ご注文・お支払い・配送のために以下の情報を収集します。
- 必須：氏名、電話番号、配送先住所、メールアドレス
- 決済情報：決済手段の種類、取引識別番号

## 2. 利用目的
- ご注文の受付および決済処理
- 商品の配送および配送状況のご案内
- 交換・返品・返金の対応
- お客様からのお問い合わせへの対応

## 3. 保有期間
- ご注文情報：取引完了後5年間
- 上記期間経過後は速やかに削除します。

## 4. 第三者への提供
当社は原則として個人情報を第三者に提供しません。ただし、配送業務のために配送会社に必要最小限の情報（氏名・住所・電話番号）を提供します。

## 5. 個人情報管理責任者
- 氏名：Koo Seungbum
- メール：applebuttercollege.official@gmail.com

## 6. 事業者情報
- 会社名：株式会社HFFF
- 代表者：Koo Seungbum
- 所在地：韓国 京畿道 南楊州市 多山循環路 20, 10F

## 7. 施行日
本ポリシーは2025年1月1日より施行します。
    `,
  },
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const c = content[lang as 'ko' | 'ja']

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-lg font-semibold mb-8 break-keep">{c.title}</h1>
      <div className="prose prose-sm text-ink-muted max-w-none [&_h2]:text-ink [&_h2]:font-medium [&_h2]:text-sm [&_h2]:mt-8 [&_h2]:mb-2">
        {c.body.trim().split('\n').map((line, i) => {
          if (line.startsWith('## ')) return <h2 key={i} className="break-keep">{line.replace('## ', '')}</h2>
          if (line.startsWith('- ')) return <p key={i} className="ml-4">· {line.slice(2)}</p>
          if (line === '') return <br key={i} />
          return <p key={i}>{line}</p>
        })}
      </div>
    </section>
  )
}
