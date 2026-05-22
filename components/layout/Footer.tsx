import Link from 'next/link'

type Dict = {
  footer: { about: string; cs: string; faq: string; privacy: string; terms: string; returns: string; copyright: string }
}

type Props = { lang: string; dict: Dict }

const bizInfo = [
  ['Company',          'HFFF Co., Ltd.'],
  ['CEO',              '구승범'],
  ['Privacy Officer',  '구승범'],
  ['Address',          '경기도 남양주시 다산순환로 20, 10층'],
  ['Business Reg.',    '846-81-02489'],
  ['E-commerce Reg.',  '2022-다산-1147'],
  ['Hosting',          'Vercel'],
]

export default function Footer({ lang, dict }: Props) {
  const legalLinks = [
    { label: dict.footer.about,   href: `/${lang}/about` },
    { label: dict.footer.faq,     href: `/${lang}/faq` },
    { label: dict.footer.returns, href: `/${lang}/returns` },
    { label: dict.footer.privacy, href: `/${lang}/privacy` },
    { label: dict.footer.terms,   href: `/${lang}/terms` },
  ]

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-10 flex flex-col gap-4 sm:gap-6">

        {/* 브랜드 + SNS */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-widest uppercase text-ink">
            applebuttercollege
          </span>
          <a
            href="https://www.instagram.com/applebuttercollege"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-ink-muted hover:text-ink transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
            </svg>
          </a>
        </div>

        {/* 연락처 */}
        <div className="flex flex-col gap-1">
          <a href="mailto:applebuttercollege.official@gmail.com" className="text-xs text-ink-muted hover:text-ink transition-colors [overflow-wrap:anywhere]">
            applebuttercollege.official@gmail.com
          </a>
          <a href="tel:01023398492" className="text-xs text-ink-muted hover:text-ink transition-colors w-fit">
            010-2339-8492
          </a>
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
          </div>
        </details>

        {/* 하단: 법적 링크 + 저작권 */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 border-t border-border pt-4 sm:pt-5">
          <nav className="flex flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-ink-muted hover:text-ink transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-ink-muted">{dict.footer.copyright}</p>
        </div>

      </div>
    </footer>
  )
}
