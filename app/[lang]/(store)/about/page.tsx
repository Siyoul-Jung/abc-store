import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { hasLocale } from '../../dictionaries'
import type { Locale } from '@/lib/shopify/types'
import Reveal from '@/components/ui/Reveal'

type Value = { no: string; title: string; desc: string }
type AboutContent = {
  brandLabel: string
  heroTagline: string
  storyLabel: string
  storyTitle: string
  storyBody: string[]
  valuesLabel: string
  values: Value[]
  closingTitle: string
  closingBody: string
  contactLabel: string
  contactText: string
  contactCta: string
}

const content: Record<Locale, AboutContent> = {
  ko: {
    brandLabel: 'applebuttercollege',
    heroTagline: '어린이의 일상을 특별하게',
    storyLabel: 'Our Story',
    storyTitle: '아이들의 일상을\n더 특별하게',
    storyBody: [
      'applebuttercollege는 아이들의 일상을 더 특별하게 만드는 아동복 브랜드입니다.',
      '편안한 소재와 감각적인 디자인으로, 아이가 자유롭게 뛰놀 수 있는 옷을 만들어요.',
      '한 벌 한 벌, 정성껏 만든 옷이 아이의 하루를 빛내주길 바랍니다.',
    ],
    valuesLabel: 'What We Value',
    values: [
      { no: '01', title: '편안한 소재', desc: '아이 피부에 닿는 것부터 생각합니다. 온종일 입어도 편안하도록.' },
      { no: '02', title: '감각적인 디자인', desc: '자유롭게 뛰놀면서도 감각을 잃지 않는, 매일 입히고 싶은 옷.' },
      { no: '03', title: '정성스러운 마감', desc: '한 벌 한 벌, 손이 가는 정성으로 완성합니다.' },
    ],
    closingTitle: '아이의 하루를 응원합니다',
    closingBody: '정성껏 만든 한 벌이 아이의 하루를 빛내주기를 바랍니다.',
    contactLabel: 'Contact',
    contactText: '궁금한 점은 홈페이지 내 고객 게시판을 이용해 주세요.',
    contactCta: 'Contact Us',
  },
  ja: {
    brandLabel: 'applebuttercollege',
    heroTagline: '子どもの日常を特別に',
    storyLabel: 'Our Story',
    storyTitle: '子どもたちの日常を\nもっと特別に',
    storyBody: [
      'applebuttercollege は、子どもたちの日常をもっと特別にする子ども服ブランドです。',
      '快適な素材と感性豊かなデザインで、子どもが自由に走り回れる服をつくっています。',
      '一枚一枚、丁寧につくった服が、お子様の毎日を彩ることを願っています。',
    ],
    valuesLabel: 'What We Value',
    values: [
      { no: '01', title: '快適な素材', desc: '子どもの肌に触れるものから考えます。一日中着ても心地よいように。' },
      { no: '02', title: '感性豊かなデザイン', desc: '自由に走り回れて、それでいて感性を失わない、毎日着せたい服。' },
      { no: '03', title: '丁寧な仕上げ', desc: '一枚一枚、手をかけた丁寧さで仕上げます。' },
    ],
    closingTitle: 'お子様の毎日を応援します',
    closingBody: '丁寧につくった一枚が、お子様の毎日を彩ることを願っています。',
    contactLabel: 'Contact',
    contactText: 'ご不明な点はサイト内のお問い合わせフォームよりご連絡ください。',
    contactCta: 'Contact Us',
  },
  en: {
    brandLabel: 'applebuttercollege',
    heroTagline: 'Making everyday moments special',
    storyLabel: 'Our Story',
    storyTitle: 'Making everyday\nmoments special',
    storyBody: [
      "applebuttercollege is a children's clothing brand that makes everyday moments more special for kids.",
      'We create clothes with comfortable fabrics and thoughtful designs so children can run and play freely.',
      "Each piece is made with care, and we hope our clothes brighten your child's every day.",
    ],
    valuesLabel: 'What We Value',
    values: [
      { no: '01', title: 'Comfortable Fabrics', desc: 'It starts with what touches their skin — comfortable to wear all day long.' },
      { no: '02', title: 'Thoughtful Design', desc: 'Free to run and play, yet never losing a sense of style.' },
      { no: '03', title: 'Made with Care', desc: 'Each piece is finished with hands-on care, one at a time.' },
    ],
    closingTitle: "Here for your child's every day",
    closingBody: "We hope each piece, made with care, brightens your child's day.",
    contactLabel: 'Contact',
    contactText: 'For any inquiries, please use the customer message board on our website.',
    contactCta: 'Contact Us',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const titles: Record<string, string> = { ko: '브랜드 소개', ja: 'ブランドについて' }
  return { title: titles[lang] ?? titles.ko }
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const locale = lang as Locale
  const t = content[locale]

  return (
    <div className="text-ink">
      {/* ── Hero ── */}
      <section className="relative w-full h-[52vh] sm:h-[68vh] overflow-hidden">
        <Image
          src="/new_main01.png"
          alt={t.brandLabel}
          fill
          priority
          className="object-cover object-center"
        />
        {/* 글자 뒤 중앙만 은은히 어둡게 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at center, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 70%)' }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="font-display text-xs sm:text-sm tracking-[0.3em] text-white/90 uppercase mb-3 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
            {t.brandLabel}
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight break-keep max-w-[20ch] [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
            {t.heroTagline}
          </h1>
        </div>
      </section>

      {/* ── Our Story ── */}
      <Reveal>
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-display text-xs tracking-[0.3em] uppercase font-semibold text-coral mb-5">
            {t.storyLabel}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold leading-snug break-keep whitespace-pre-line mb-8">
            {t.storyTitle}
          </h2>
          <div className="flex flex-col gap-4">
            {t.storyBody.map((line, i) => (
              <p key={i} className="text-[15px] sm:text-base leading-relaxed text-ink-muted break-keep">
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ── 풀블리드 이미지 ── */}
      <section className="relative w-full h-[42vh] sm:h-[58vh] overflow-hidden">
        <Image
          src="/new_main02.png"
          alt={t.brandLabel}
          fill
          className="object-cover object-center"
        />
      </section>

      {/* ── What We Value ── */}
      <Reveal>
      <section className="bg-surface px-6 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto">
          <p className="font-display text-xs tracking-[0.3em] uppercase font-semibold text-coral text-center mb-12 sm:mb-16">
            {t.valuesLabel}
          </p>
          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {t.values.map((v) => (
              <div key={v.no} className="text-center sm:text-left">
                <p className="font-display text-2xl text-ink-muted/50 mb-3">{v.no}</p>
                <h3 className="text-lg font-bold mb-2 break-keep">{v.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted break-keep">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ── Closing (이미지 위 메시지) ── */}
      <Reveal>
      <section className="relative w-full h-[52vh] sm:h-[64vh] overflow-hidden">
        <Image
          src="/new_main03.png"
          alt={t.closingTitle}
          fill
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 72%)' }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-xl sm:text-3xl font-bold text-white leading-snug break-keep max-w-[22ch] mb-4 [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
            {t.closingTitle}
          </h2>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed break-keep max-w-[30ch] [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
            {t.closingBody}
          </p>
        </div>
      </section>
      </Reveal>

      {/* ── Contact CTA ── */}
      <Reveal>
      <section className="bg-white px-6 py-20 sm:py-24 text-center">
        <p className="font-display text-xs tracking-[0.3em] uppercase font-semibold text-coral mb-4">
          {t.contactLabel}
        </p>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed break-keep max-w-md mx-auto mb-8">
          {t.contactText}
        </p>
        <Link
          href={`/${locale}/qa`}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80"
        >
          {t.contactCta}
          <span aria-hidden>→</span>
        </Link>
      </section>
      </Reveal>
    </div>
  )
}
