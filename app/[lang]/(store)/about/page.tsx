import { notFound } from 'next/navigation'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'

const content = {
  ko: {
    title: '브랜드 소개',
    body: [
      'applebuttercollege는 아이들의 일상을 더 특별하게 만드는 아동복 브랜드입니다.',
      '편안한 소재와 감각적인 디자인으로, 아이가 자유롭게 뛰놀 수 있는 옷을 만들어요.',
      '한 벌 한 벌, 정성껏 만든 옷이 아이의 하루를 빛내주길 바랍니다.',
    ],
    contact: '문의',
    contactText: '궁금한 점은 홈페이지 내 고객 게시판을 이용해 주세요.',
  },
  ja: {
    title: 'ブランドについて',
    body: [
      'applebuttercollege は、子どもたちの日常をもっと特別にする子ども服ブランドです。',
      '快適な素材と感性豊かなデザインで、子どもが自由に走り回れる服をつくっています。',
      '一枚一枚、丁寧につくった服が、お子様の毎日を彩ることを願っています。',
    ],
    contact: 'お問い合わせ',
    contactText: 'ご不明な点はサイト内のお問い合わせフォームよりご連絡ください。',
  },
  en: {
    title: 'About Us',
    body: [
      'applebuttercollege is a children\'s clothing brand that makes everyday moments more special for kids.',
      'We create clothes with comfortable fabrics and thoughtful designs so children can run and play freely.',
      'Each piece is made with care, and we hope our clothes brighten your child\'s every day.',
    ],
    contact: 'Contact',
    contactText: 'For any inquiries, please use the customer message board on our website.',
  },
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const t = content[lang as Locale]

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-sm font-bold tracking-widest uppercase mb-10">{t.title}</h1>

      <div className="flex flex-col gap-5">
        {t.body.map((line, i) => (
          <p key={i} className="text-[15px] leading-relaxed text-ink">
            {line}
          </p>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-xs font-medium tracking-widest uppercase text-ink-muted mb-2">
          {t.contact}
        </p>
        <p className="text-sm text-ink-muted">{t.contactText}</p>
      </div>
    </section>
  )
}
