'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function LanguageSwitcher({ lang }: { lang: string }) {
  const pathname = usePathname()

  const switchLocale = (next: string) =>
    pathname.replace(new RegExp(`^/${lang}`), `/${next}`)

  return (
    <div className="flex items-center gap-1 text-xs font-medium tracking-widest">
      {lang === 'ko' ? (
        <>
          <span className="text-ink">KO</span>
          <span className="text-muted">/</span>
          <Link href={switchLocale('ja')} className="text-muted hover:text-ink transition-colors">JA</Link>
        </>
      ) : (
        <>
          <Link href={switchLocale('ko')} className="text-muted hover:text-ink transition-colors">KO</Link>
          <span className="text-muted">/</span>
          <span className="text-ink">JA</span>
        </>
      )}
    </div>
  )
}
