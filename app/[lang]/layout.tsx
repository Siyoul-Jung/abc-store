import type { Metadata } from 'next'
import '../globals.css'
import { hasLocale } from './dictionaries'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: {
    default: 'applebuttercollege',
    template: '%s — applebuttercollege',
  },
  description: '아이들을 위한 특별한 옷, applebuttercollege',
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
    <html lang={lang} className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
