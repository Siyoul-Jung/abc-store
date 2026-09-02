import { notFound } from 'next/navigation'
import { hasLocale } from '../../dictionaries'

type Props = { params: Promise<{ lang: string }> }

// 구매안전서비스 이용 확인증 (전자상거래법 제13조 제2항 제10호 / 제24조)
// 계좌이체(현금성) 결제 대금예치 — 토스페이먼츠 발급. 한국 결제 전용 법적 표시.
const cert = {
  title: '구매안전서비스 이용 확인증',
  merchant: [
    ['상호', '주식회사 에이치에프에프에프'],
    ['소재지', '경기도 남양주시 다산순환로 20 (다산동) 10층 제비에이 10-006호'],
    ['대표자', '구승범'],
    ['사업자등록번호', '846-81-02489'],
  ],
  statement:
    '위의 사업자가 「전자상거래 등에서의 소비자보호에 관한 법률」 제13조 제2항 제10호에 따른 결제대금예치 또는 같은 법 제24조 제1항 각 호에 따른 소비자피해보상 보험계약 등을 체결하였음을 다음과 같이 증명합니다.',
  service: [
    ['서비스 제공자', '토스페이먼츠 주식회사'],
    ['서비스 이용기간', '2026-08-27 ~ 2027-08-26 (1년 자동갱신)'],
    ['서비스 등록번호', 'A08-260827-0001'],
    ['이용 확인 연락처', '1544-7772'],
  ],
  issued: '2026년 09월 01일',
  issuer: '토스페이먼츠 주식회사',
}

export const metadata = { title: '구매안전서비스 이용 확인증' }

export default async function EscrowPage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex gap-3 text-sm">
      <span className="shrink-0 w-28 text-ink-muted">{label}</span>
      <span className="text-ink break-keep">{value}</span>
    </div>
  )

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-lg font-semibold mb-8 break-keep">{cert.title}</h1>

      {/* 가맹점 정보 */}
      <div className="flex flex-col gap-1.5 mb-8">
        {cert.merchant.map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </div>

      {/* 법적 근거 문구 */}
      <p className="text-sm text-ink-muted leading-relaxed break-keep mb-8">
        {cert.statement}
      </p>

      {/* 서비스 내역 */}
      <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface px-5 py-5 mb-8">
        {cert.service.map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </div>

      {/* 발급 */}
      <div className="flex flex-col gap-1 text-sm text-ink-muted">
        <span>{cert.issued}</span>
        <span className="text-ink font-medium">{cert.issuer}</span>
      </div>
    </section>
  )
}
