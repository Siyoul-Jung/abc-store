import Image from 'next/image'
import type { Locale } from '@/lib/shopify/types'

type Props = {
  lang: Locale
  season: string
  tagline: string
  ctaLabel: string
}

export default function Hero({ lang, season, tagline, ctaLabel }: Props) {
  return (
    <section className="relative w-full h-[32vh] sm:h-[55vh]">
      <Image
        src="/new_main03.png"
        alt="applebuttercollege 2025 S/S"
        fill
        className="object-cover object-center"
        priority
      />
    </section>
  )
}
