import { notFound } from 'next/navigation'
import { hasLocale } from '../dictionaries'
import { getProducts } from '@/lib/shopify/storefront'
import type { Locale } from '@/lib/shopify/types'
import type { HeroSlide } from '@/components/home/Hero'
import { LoungeHero, ValueBand, WhySection, PrintPicker, ClosingBanner } from '@/components/lounge/HomeSections'
import InstagramFeed from '@/components/home/InstagramFeed'
import Reveal from '@/components/ui/Reveal'

type Props = { params: Promise<{ lang: string }> }

// 히어로 슬라이드를 env(HERO_SLIDES, JSON 배열 [{src,alt}])에서 읽는다.
// 미설정/형식오류면 undefined → Hero가 내장 기본 슬라이드로 폴백.
// 시즌 교체 시 Vercel 환경변수만 바꾸면 됨(코드 수정·재배포 자동).
function getHeroSlides(): HeroSlide[] | undefined {
  const raw = process.env.HERO_SLIDES
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((s) => s && typeof s.src === 'string')) {
      return parsed.map((s) => ({ src: s.src, alt: typeof s.alt === 'string' ? s.alt : 'applebuttercollege' }))
    }
  } catch {
    console.error('[HERO_SLIDES] JSON 파싱 실패 — 기본 슬라이드 사용')
  }
  return undefined
}

export default async function HomePage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const products = await getProducts(lang as Locale, 6)
  const locale = lang as Locale

  // 브랜드 이미지 자리는 촬영본 전까지 프린트 톤 색 블록으로 비움(구 아동복 컷이 컨셉과 안 맞음).
  // 히어로만 HERO_SLIDES 첫 장이 있으면 사용 — 촬영본 교체 시 env만 설정.
  const heroSlide = getHeroSlides()?.[0]
  const heroImage = heroSlide ? { url: heroSlide.src, altText: heroSlide.alt } : null
  const prints = products.filter((p) => p.variants.nodes.some((v) => v.availableForSale)).slice(0, 4)

  return (
    <>
      <LoungeHero lang={locale} image={heroImage} />
      <ValueBand />
      <WhySection lang={locale} images={[]} />
      <PrintPicker products={prints} lang={locale} />
      <ClosingBanner lang={locale} image={null} />
      <Reveal>
        <InstagramFeed />
      </Reveal>
    </>
  )
}
