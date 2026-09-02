import Link from 'next/link'
import LanguageSwitcher from './LanguageSwitcher'

type Dict = {
  footer: {
    about: string; cs: string; faq: string; privacy: string; terms: string
    refund: string; returns: string; qa: string; company: string; copyright: string
  }
}

type Props = { lang: string; dict: Dict }

const bizInfo = [
  ['Company',          'HFFF Co., Ltd.'],
  ['CEO',              '구승범'],
  ['Privacy Officer',  '구승범'],
  ['Address',          '경기도 남양주시 다산순환로 20, 10층'],
  ['Business Reg.',    '846-81-02489'],
  ['E-commerce Reg.',  '2022-다산-1147'],
  ['Escrow',           'Toss Payments · A08-260827-0001'],
  ['Hosting',          'Vercel'],
]

export default function Footer({ lang, dict }: Props) {
  // 고객지원: 문의·도움 동선
  const csLinks = [
    { label: dict.footer.faq,     href: `/${lang}/faq` },
    { label: dict.footer.returns, href: `/${lang}/returns` },
    { label: dict.footer.qa,      href: `/${lang}/qa` },
  ]
  // 회사·정책
  const companyLinks = [
    { label: dict.footer.about,   href: `/${lang}/about` },
    { label: dict.footer.privacy, href: `/${lang}/privacy` },
    { label: dict.footer.terms,   href: `/${lang}/terms` },
    { label: dict.footer.refund,  href: `/${lang}/refund` },
  ]

  const colTitle = 'text-[11px] font-semibold tracking-widest uppercase text-ink mb-3'
  const colLink = 'text-xs text-ink-muted hover:text-ink transition-colors w-fit'

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 flex flex-col gap-8">

        {/* 상단: 3컬럼 (모바일 = 브랜드 전체폭 + 링크 2열) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">

          {/* 브랜드 */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
            <span className="text-sm font-semibold tracking-widest uppercase text-ink">
              applebuttercollege
            </span>
            <div className="flex flex-col gap-1">
              <a href="mailto:applebuttercollege.official@gmail.com" className="text-xs text-ink-muted hover:text-ink transition-colors [overflow-wrap:anywhere]">
                applebuttercollege.official@gmail.com
              </a>
              <a href="tel:01023398492" className="text-xs text-ink-muted hover:text-ink transition-colors w-fit">
                010-2339-8492
              </a>
            </div>
            <a
              href="https://www.instagram.com/applebuttercollege"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-ink-muted hover:text-ink transition-colors w-fit mt-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
          </div>

          {/* 고객지원 */}
          <nav className="flex flex-col gap-2.5">
            <p className={colTitle}>{dict.footer.cs}</p>
            {csLinks.map((l) => (
              <Link key={l.href} href={l.href} className={colLink}>{l.label}</Link>
            ))}
          </nav>

          {/* 회사·정책 */}
          <nav className="flex flex-col gap-2.5">
            <p className={colTitle}>{dict.footer.company}</p>
            {companyLinks.map((l) => (
              <Link key={l.href} href={l.href} className={colLink}>{l.label}</Link>
            ))}
          </nav>

        </div>

        {/* 사업자 정보 (접기) */}
        <details className="group">
          <summary className="list-none flex items-center gap-1 w-fit cursor-pointer text-xs text-ink-muted hover:text-ink transition-colors select-none">
            Business Info
            <span className="text-[10px] transition-transform duration-200 group-open:rotate-180 inline-block">▾</span>
          </summary>
          <div className="mt-3 flex flex-col gap-1.5">
            {bizInfo.map(([label, value]) => (
              <div key={label} className="flex gap-3 text-xs text-ink-muted">
                <span className="shrink-0 w-24 text-ink-muted/70">{label}</span>
                <span>{value}</span>
              </div>
            ))}
            {/* 구매안전서비스(에스크로) 가입사실 확인 — 한국 계좌이체 전용 법적 표시 */}
            {lang === 'ko' && (
              <Link
                href={`/${lang}/escrow`}
                className="mt-1.5 w-fit text-xs text-ink-muted underline underline-offset-4 hover:text-ink transition-colors"
              >
                구매안전서비스 가입사실 확인 →
              </Link>
            )}
          </div>
        </details>

        {/* 하단 바: 저작권 + 언어 */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 border-t border-border pt-5">
          <p className="text-xs text-ink-muted">{dict.footer.copyright}</p>
          <LanguageSwitcher lang={lang} />
        </div>

      </div>
    </footer>
  )
}
