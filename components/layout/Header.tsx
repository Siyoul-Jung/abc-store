'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import LanguageSwitcher from './LanguageSwitcher'
import MobileMenu from './MobileMenu'
import SearchBar from './SearchBar'
import { getCartCount } from '@/lib/actions/cart'

type NavItem = { label: string; href: string }

type Dict = {
  nav: { kids: string; adult: string; new: string; sale: string; about: string; cart: string; menu: string; close: string; account: string; login: string }
}

type Props = { lang: string; dict: Dict }

export default function Header({ lang, dict }: Props) {
  const pathname = usePathname()
  const isHome = pathname === `/${lang}` || pathname === `/${lang}/`
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 60)
      if (y > 80) {
        setHidden(y > lastScrollY.current)
      } else {
        setHidden(false)
      }
      lastScrollY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    getCartCount().then(setCartCount)
    const onUpdate = () => getCartCount().then(setCartCount)
    window.addEventListener('cart:updated', onUpdate)
    return () => window.removeEventListener('cart:updated', onUpdate)
  }, [pathname])

  useEffect(() => {
    setLoggedIn(document.cookie.includes('customer_logged_in=1'))
  }, [pathname])


  const navItems: NavItem[] = [
    { label: dict.nav.kids,  href: `/${lang}/collections/kids` },
    { label: dict.nav.adult, href: `/${lang}/collections/adult` },
    { label: dict.nav.new,   href: `/${lang}/collections/new` },
    { label: dict.nav.sale,  href: `/${lang}/collections/sale` },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-30 bg-white transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* 왼쪽: 데스크톱 nav / 모바일 햄버거+검색 */}
        <div className="flex items-center gap-4">
          {/* 데스크톱 nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] font-normal text-ink hover:opacity-60 transition-opacity"
              >
                {item.label}
              </Link>
            ))}
          </div>
          {/* 모바일: 햄버거 */}
          <div className="flex md:hidden">
            <MobileMenu
              lang={lang}
              navItems={navItems}
              labels={{ menu: dict.nav.menu, close: dict.nav.close, cart: dict.nav.cart, account: dict.nav.account, login: dict.nav.login }}
              loggedIn={loggedIn}
            />
          </div>
          {/* 모바일: 검색 */}
          <div className="flex md:hidden">
            <SearchBar lang={lang as 'ko' | 'ja' | 'en'} />
          </div>
        </div>

        {/* 가운데: 로고 — 항상 절대 중앙 */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href={`/${lang}`} className="block outline-none hover:opacity-60 transition-opacity">
            <Image src="/logo.png" alt="applebuttercollege" width={300} height={44} className="block h-[44px] w-auto object-contain" priority />
          </Link>
        </div>

        {/* 오른쪽: 검색(데스크톱) + 언어(데스크톱) + 계정 + 장바구니 */}
        <div className="flex items-center gap-5">
          <div className="hidden md:flex">
            <SearchBar lang={lang as 'ko' | 'ja' | 'en'} />
          </div>
          <div className="hidden md:flex"><LanguageSwitcher lang={lang} /></div>
          <a
            href={loggedIn ? `/${lang}/account` : `/api/auth/login?redirect=/${lang}/account`}
            aria-label={loggedIn ? '내 계정' : '로그인'}
            className="text-ink hover:opacity-60 transition-opacity inline-flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
          </a>
          <Link
            href={`/${lang}/cart`}
            aria-label={dict.nav.cart}
            className="relative inline-flex items-center text-ink hover:opacity-60 transition-opacity"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-coral text-white text-[10px] font-medium rounded-full flex items-center justify-center leading-none">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </header>
  )
}
