'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

const LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
]

export default function LanguageSwitcher({ lang }: { lang: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function switchLocale(next: string) {
    document.cookie = `lang=${next};path=/;max-age=31536000;SameSite=Lax`
    const nextPath = pathname.replace(new RegExp(`^/${lang}`), `/${next}`)
    router.push(nextPath)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium tracking-widest text-ink hover:opacity-60 transition-opacity"
      >
        {lang.toUpperCase()}
        <span className={`text-[10px] transition-transform duration-150 inline-block ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-28 bg-white border border-border shadow-sm z-50">
          {LOCALES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-surface transition-colors ${
                code === lang ? 'text-ink font-medium' : 'text-ink-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
