'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = { lang: string }

const navItems = (lang: string) => [
  { label: { ko: '계정 홈', ja: 'アカウント', en: 'Overview' }, href: `/${lang}/account` },
  { label: { ko: '주문 내역', ja: '注文履歴', en: 'Orders' }, href: `/${lang}/account/orders` },
  { label: { ko: '배송지', ja: '配送先', en: 'Addresses' }, href: `/${lang}/account/addresses` },
]

export default function AccountNav({ lang }: Props) {
  const pathname = usePathname()
  const locale = lang as 'ko' | 'ja' | 'en'

  return (
    <nav className="flex gap-1 border-b border-border mb-10">
      {navItems(lang).map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2.5 text-[13px] border-b-2 transition-colors ${
              active
                ? 'border-ink text-ink font-medium'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {item.label[locale]}
          </Link>
        )
      })}
    </nav>
  )
}
