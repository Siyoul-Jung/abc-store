import { notFound } from 'next/navigation'
import { hasLocale, getDictionary } from '../dictionaries'
import { getProducts } from '@/lib/shopify/storefront'
import type { Locale } from '@/lib/shopify/types'
import Hero, { type HeroSlide } from '@/components/home/Hero'
import ProductGrid from '@/components/home/ProductGrid'
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

  const [products, dict] = await Promise.all([
    getProducts(lang as Locale, 6),
    getDictionary(lang as Locale),
  ])

  return (
    <>
      <Hero
        lang={lang as Locale}
        season={dict.home.season}
        tagline={dict.home.tagline}
        ctaLabel={dict.home.cta}
        slides={getHeroSlides()}
      />
      <ProductGrid
        products={products}
        lang={lang as Locale}
        title={dict.home.newArrivals}
        viewAllLabel={dict.common.viewAll}
      />
      <Reveal>
        <InstagramFeed />
      </Reveal>
    </>
  )
}
