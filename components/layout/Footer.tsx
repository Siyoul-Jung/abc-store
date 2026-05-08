import Link from 'next/link'

type Dict = {
  footer: { cs: string; privacy: string; terms: string; refund: string; copyright: string }
}

type Props = { lang: string; dict: Dict }

export default function Footer({ lang, dict }: Props) {
  const legalLinks = [
    { label: dict.footer.privacy, href: `/${lang}/privacy` },
    { label: dict.footer.terms,   href: `/${lang}/terms` },
    { label: dict.footer.refund,  href: `/${lang}/refund` },
  ]

  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">

        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold tracking-widest uppercase text-ink">
              applebuttercollege
            </span>
            <p className="text-xs text-ink">주식회사 에이치에프에프에프</p>
            <p className="text-xs text-ink">010-2339-8492</p>
          </div>

          {/* 소셜 아이콘 */}
          <div className="flex items-start gap-4">
            <a
              href="https://www.instagram.com/applebuttercollege"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-ink hover:text-ink transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 border-t border-border pt-6">
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-ink hover:text-ink transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-ink">{dict.footer.copyright}</p>
        </div>

      </div>
    </footer>
  )
}
