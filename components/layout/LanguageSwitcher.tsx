'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function LanguageSwitcher({ lang }: { lang: string }) {
  const pathname = usePathname()

  const switchLocale = (next: string) =>
    pathname.replace(new RegExp(`^/${lang}`), `/${next}`)

  function saveLang(next: string) {
    document.cookie = `lang=${next};path=/;max-age=31536000;SameSite=Lax`
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium tracking-widest">
      {lang === 'ko' ? (
        <>
          <span className="text-ink">KO</span>
          <span className="text-muted">/</span>
          <Link href={switchLocale('ja')} onClick={() => saveLang('ja')} className="text-muted hover:text-ink transition-colors">JA</Link>
        </>
      ) : (
        <>
          <Link href={switchLocale('ko')} onClick={() => saveLang('ko')} className="text-muted hover:text-ink transition-colors">KO</Link>
          <span className="text-muted">/</span>
          <span className="text-ink">JA</span>
        </>
      )}
    </div>
  )
}
