'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { Locale } from '@/lib/shopify/types'

const slides = [
  { src: '/new_main01.png', alt: 'applebuttercollege 2025 S/S' },
  { src: '/new_main02.png', alt: 'applebuttercollege 2025 S/S' },
  { src: '/new_main03.png', alt: 'applebuttercollege 2025 S/S' },
]

type Props = {
  lang: Locale
  season: string
  tagline: string
  ctaLabel: string
}

export default function Hero({ lang, season, tagline, ctaLabel }: Props) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative w-full h-[32vh] sm:h-[55vh] overflow-hidden">
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

      {/* 인디케이터 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === current ? 'bg-white' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
