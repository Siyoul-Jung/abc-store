'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Locale } from '@/lib/shopify/types'

export type HeroSlide = { src: string; alt: string }

// 기본 슬라이드(코드 내장). 환경변수 HERO_SLIDES 미설정 시 폴백.
const DEFAULT_SLIDES: HeroSlide[] = [
  { src: '/new_main01.png', alt: 'applebuttercollege 2026 S/S' },
  { src: '/new_main02.png', alt: 'applebuttercollege 2026 S/S' },
  { src: '/new_main03.png', alt: 'applebuttercollege 2026 S/S' },
]

type Props = {
  lang: Locale
  season: string
  tagline: string
  ctaLabel: string
  slides?: HeroSlide[]   // 서버에서 env 기반 주입(없으면 기본). 코드 수정 없이 시즌 교체용.
}

export default function Hero({ lang, season, tagline, ctaLabel, slides: slidesProp }: Props) {
  const slides = slidesProp && slidesProp.length > 0 ? slidesProp : DEFAULT_SLIDES
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative w-full h-[44vh] sm:h-[60vh] overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover object-center"
            priority={i === 0}
          />
        </div>
      ))}

      {/* 비네트 */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)' }}
      />

      {/* 텍스트 가독성용 스크림: 글자 뒤 중앙만 은은히 어둡게 (가장자리는 밝게 유지) */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ background: 'radial-gradient(ellipse 75% 55% at center, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 68%)' }}
      />
      {/* 하단만 살짝 — 인디케이터/버튼 영역 안정 */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* 헤드라인 오버레이 */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 pb-10 sm:pb-14">
        <p className="font-display text-xs sm:text-sm tracking-[0.25em] text-white/90 uppercase mb-2 sm:mb-3 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
          {season}
        </p>
        <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight max-w-[18ch] break-keep [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
          {tagline}
        </h1>
        <Link
          href={`/${lang}/collections/new`}
          className="mt-5 sm:mt-7 inline-flex items-center gap-1.5 rounded-full bg-coral px-6 py-3 text-sm sm:text-base font-medium text-white transition-opacity hover:opacity-90"
        >
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>

      {/* 인디케이터 — 점은 작게 보이되 탭 영역은 p-2.5로 확대 */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`슬라이드 ${i + 1}`}
            className="p-2.5 flex items-center justify-center"
          >
            <span
              className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                i === current ? 'bg-white' : 'bg-white/40'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
