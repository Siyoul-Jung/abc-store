import type { Metadata } from 'next'
import { hasLocale } from './dictionaries'
import { notFound } from 'next/navigation'
import LangSetter from './LangSetter'

export const metadata: Metadata = {
  title: {
    default: 'applebuttercollege',
    template: '%s — applebuttercollege',
  },
  description: '아이들을 위한 특별한 옷, applebuttercollege',
  metadataBase: new URL('https://applebuttercollege.com'),
  openGraph: {
    siteName: 'applebuttercollege',
    images: [{ url: '/insta_logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/insta_logo.png'],
  },
}

export async function generateStaticParams() {
  return [{ lang: 'ko' }, { lang: 'ja' }]
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  return (
    <>
      <LangSetter lang={lang} />
      {children}
    </>
  )
}
