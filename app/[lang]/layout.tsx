import type { Metadata } from 'next'
import { hasLocale } from './dictionaries'
import { notFound } from 'next/navigation'
import LangSetter from './LangSetter'

const descriptions: Record<string, string> = {
  ko: '아이들을 위한 특별한 옷, applebuttercollege',
  ja: '子どもたちのための特別な服、applebuttercollege',
  en: 'Special clothes for kids — applebuttercollege',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const description = descriptions[lang] ?? descriptions.ko

  return {
    title: {
      default: 'applebuttercollege',
      template: '%s — applebuttercollege',
    },
    description,
    metadataBase: new URL('https://applebuttercollege.com'),
    openGraph: {
      siteName: 'applebuttercollege',
      description,
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'applebuttercollege' }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-default.png'],
    },
  }
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
