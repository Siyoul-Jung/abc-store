import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartToast from '@/components/layout/CartToast'
import NoticeBanner from '@/components/layout/NoticeBanner'
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

  // 공지 문구는 환경변수로 관리 (코드 수정 없이 교체). 비어 있으면 배너 미노출.
  const notice = lang === 'ja' ? process.env.NEXT_PUBLIC_NOTICE_JA : process.env.NEXT_PUBLIC_NOTICE_KO
  const noticeHref = process.env.NEXT_PUBLIC_NOTICE_LINK

  return (
    <>
      <Header lang={lang} dict={dict} />
      <main className="flex-1 pt-16">
        <NoticeBanner text={notice} href={noticeHref} />
        {children}
      </main>
      <Footer lang={lang} dict={dict} />
      <CartToast lang={lang as Locale} />
    </>
  )
}
