'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import LanguageSwitcher from './LanguageSwitcher'
import MobileMenu from './MobileMenu'
import SearchBar from './SearchBar'

type NavChild = { label: string; href: string }
type NavItem = { label: string; href: string; children?: NavChild[] }

type Dict = {
  nav: { kids: string; kidsShort: string; kidsLong: string; adult: string; new: string; collections: string; sale: string; about: string; cart: string; menu: string; close: string }
}

type Props = { lang: string; dict: Dict }

export default function Header({ lang, dict }: Props) {
  const pathname = usePathname()
  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const transparent = isHome && !scrolled

  const navItems: NavItem[] = [
    {
      label: dict.nav.kids,
      href: `/${lang}/collections/kids`,
      children: [
        { label: dict.nav.kidsShort, href: `/${lang}/collections/kids-short` },
        { label: dict.nav.kidsLong,  href: `/${lang}/collections/kids-long` },
      ],
    },
    { label: dict.nav.adult, href: `/${lang}/collections/adult` },
    { label: dict.nav.new,   href: `/${lang}/collections/new` },
    { label: dict.nav.sale,  href: `/${lang}/collections/sale` },
    { label: dict.nav.about, href: `/${lang}/about` },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* 왼쪽: nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className="text-[13px] font-normal text-ink hover:opacity-60 transition-opacity"
                >
                  {item.label}
                </Link>
                <div className="absolute top-full left-0 pt-2 hidden group-hover:block z-20">
                  <div className="bg-white border border-border py-1 min-w-[110px]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2.5 text-[12px] text-ink hover:opacity-60 transition-opacity whitespace-nowrap"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] font-normal text-ink hover:opacity-60 transition-opacity"
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* 모바일: 햄버거 */}
        <div className="flex md:hidden">
          <MobileMenu
            lang={lang}
            navItems={navItems}
            labels={{ menu: dict.nav.menu, close: dict.nav.close, cart: dict.nav.cart }}
          />
        </div>

        {/* 가운데: 로고 — 모바일은 flex-1 중앙, 데스크톱은 absolute 중앙 */}
        <div className="flex-1 flex md:hidden justify-center">
          <Link
            href={`/${lang}`}
            className="text-[18px] font-bold hover:opacity-60 transition-opacity whitespace-nowrap"
            style={{ fontFamily: 'var(--font-display)', color: '#E8000A' }}
          >
            applebuttercollege
          </Link>
        </div>
        <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
          <Link
            href={`/${lang}`}
            className="text-[26px] font-bold hover:opacity-60 transition-opacity whitespace-nowrap"
            style={{ fontFamily: 'var(--font-display)', color: '#E8000A' }}
          >
            applebuttercollege
          </Link>
        </div>

        {/* 오른쪽: 검색 + 언어(데스크톱만) + 장바구니 */}
        <div className="flex items-center gap-5">
          <SearchBar lang={lang as 'ko' | 'ja'} />
          <div className="hidden md:flex"><LanguageSwitcher lang={lang} /></div>
          <Link
            href={`/${lang}/cart`}
            aria-label={dict.nav.cart}
            className="text-ink hover:opacity-60 transition-opacity"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </Link>
        </div>

      </div>
    </header>
  )
}
