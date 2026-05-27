'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'

type NavItem = { label: string; href: string }

type Props = {
  lang: string
  navItems: NavItem[]
  labels: { menu: string; close: string; account: string; login: string }
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

      {open && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[101] w-72 bg-white flex flex-col">

            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-5">
              <Link href={`/${lang}`} onClick={() => setOpen(false)} className="hover:opacity-60 transition-opacity">
                <Image src="/logo.png" alt="applebuttercollege" width={160} height={24} className="h-6 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                className="text-ink-muted hover:text-ink transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="2" y1="2" x2="16" y2="16" />
                  <line x1="16" y1="2" x2="2" y2="16" />
                </svg>
              </button>
            </div>

            {/* 계정 */}
            <div className="px-6 py-4 border-t border-border">
              <a
                href={loggedIn ? `/${lang}/account` : `/api/auth/login?redirect=/${lang}/account`}
                onClick={() => setOpen(false)}
                className={`block text-center text-sm py-3 rounded-full transition-colors ${
                  loggedIn
                    ? 'border border-border text-ink-muted hover:text-ink'
                    : 'bg-ink text-white hover:opacity-75'
                }`}
              >
                {loggedIn ? labels.account : labels.login}
              </a>
            </div>

            {/* nav */}
            <nav className="flex flex-col px-6 pt-2 pb-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="py-4 text-[15px] font-medium tracking-widest uppercase border-b border-border/50 hover:opacity-50 transition-opacity"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

          </div>
        </>,
        document.body
      )}
    </>
  )
}
