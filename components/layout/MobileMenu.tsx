'use client'

import { useState } from 'react'
import Link from 'next/link'

type NavItem = { label: string; href: string }

type Props = {
  lang: string
  navItems: NavItem[]
  labels: { menu: string; close: string; cart: string }
}

export default function MobileMenu({ lang, navItems, labels }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={labels.menu}
        className="flex flex-col gap-1.5 p-1"
      >
        <span className="block w-5 h-px bg-ink" />
        <span className="block w-5 h-px bg-ink" />
        <span className="block w-5 h-px bg-ink" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/20"
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
                  className="text-lg font-medium tracking-wide hover:text-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto px-6 py-8 border-t border-border">
              <Link
                href={`/${lang}/cart`}
                onClick={() => setOpen(false)}
                className="text-sm text-ink-muted hover:text-ink transition-colors"
              >
                {labels.cart}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
