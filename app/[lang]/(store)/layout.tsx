import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartToast from '@/components/layout/CartToast'
import { getDictionary, hasLocale } from '../dictionaries'
import type { Locale } from '@/lib/shopify/types'

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  return (
    <>
      <Header lang={lang} dict={dict} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer lang={lang} dict={dict} />
      <CartToast lang={lang as Locale} />
    </>
  )
}
