'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LanguageSwitcher from './LanguageSwitcher'

type NavItem = { label: string; href: string }

type Props = {
  lang: string
  navItems: NavItem[]
  labels: { menu: string; close: string; cart: string; account: string; login: string }
  loggedIn: boolean
}

export default function MobileMenu({ lang, navItems, labels, loggedIn }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={labels.menu}
        className="p-1 text-ink hover:opacity-60 transition-opacity"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="19" y2="6" />
          <line x1="3" y1="11" x2="19" y2="11" />
          <line x1="3" y1="16" x2="19" y2="16" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <span className="text-sm font-medium tracking-widest uppercase">
                applebuttercollege
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="text-ink-muted hover:text-ink transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <nav className="flex flex-col px-6 py-8 gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-medium tracking-wide hover:opacity-60 transition-opacity"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto px-6 py-8 border-t border-border flex flex-col gap-4">
              <a
                href={loggedIn ? `/${lang}/account` : `/api/auth/login?redirect=/${lang}/account`}
                onClick={() => setOpen(false)}
                className="text-sm text-ink-muted hover:text-ink transition-colors"
              >
                {loggedIn ? labels.account : labels.login}
              </a>
              <Link
                href={`/${lang}/returns`}
                onClick={() => setOpen(false)}
                className="text-sm text-ink-muted hover:text-ink transition-colors"
              >
                반품 신청
              </Link>
              <div className="flex items-center justify-between">
                <Link
                  href={`/${lang}/cart`}
                  onClick={() => setOpen(false)}
                  className="text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  {labels.cart}
                </Link>
                <LanguageSwitcher lang={lang} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
