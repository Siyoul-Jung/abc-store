import Image from 'next/image'
import Link from 'next/link'
import { gidToNumericId, formatPrice, stripTitlePrefix } from '@/lib/utils/format'
import type { Product, Locale } from '@/lib/shopify/types'
import { LOUNGE_COPY as C, LOUNGE_TONES } from './copy'

// 홈 Lounge 컨셉 섹션 모음 — 서버 컴포넌트(클라이언트 JS 없음).
// 이미지가 없으면 프린트 톤 색 블록으로 비워 둔다(실사 촬영본 교체 전 단계).

type Img = { url: string; altText?: string | null } | null | undefined

function Photo({ img, tone, sizes, priority }: { img: Img; tone: string; sizes: string; priority?: boolean }) {
  return (
    <div className={`relative w-full h-full ${tone}`}>
      {img && (
        <Image src={img.url} alt={img.altText ?? ''} fill sizes={sizes} className="object-cover" priority={priority} />
      )}
    </div>
  )
}

function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-forest px-6 py-3 font-headline text-[15px] tracking-[0.04em] uppercase text-white hover:opacity-90 transition-opacity"
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  )
}

export function LoungeHero({ lang, image }: { lang: Locale; image: Img }) {
  return (
    <section className="bg-cream">
      <div className="max-w-7xl mx-auto grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center">
        <div className="px-6 py-10 sm:py-14 md:py-20 flex flex-col items-start gap-4">
          <h1 className="font-headline uppercase text-forest leading-[0.92] text-[56px] sm:text-[80px] lg:text-[96px] text-balance">
            {C.hero.headline}
          </h1>
          <p className="text-xl sm:text-2xl text-ink leading-snug">{C.hero.sub}</p>
          <p className="text-base text-ink-muted">{C.hero.detail}</p>
          <div className="mt-2">
            <CtaButton href={`/${lang}/products`}>{C.hero.cta}</CtaButton>
          </div>
        </div>
        <div className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-[520px] max-w-full">
          <Photo img={image} tone="bg-sun" sizes="(max-width: 768px) 100vw, 60vw" priority />
          <p className="hidden sm:block absolute bottom-4 right-5 font-headline uppercase text-forest text-lg sm:text-xl tracking-[0.03em]">
            {C.hero.badge}
          </p>
        </div>
      </div>
    </section>
  )
}

export function ValueBand() {
  return (
    <div className="bg-forest text-white">
      <ul className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-center gap-2.5 sm:gap-10">
        {C.values.map((v, i) => (
          <li key={v} className="flex items-center gap-2.5 sm:gap-10">
            {i > 0 && <span aria-hidden className="h-4 sm:h-5 w-px bg-white/50" />}
            <span className="font-headline uppercase text-[13px] sm:text-2xl tracking-[0.03em] whitespace-nowrap">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WhySection({ images }: { images: Img[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <h2 className="font-headline uppercase text-ink text-4xl sm:text-6xl leading-[0.95] text-balance">{C.why.title}</h2>
      <p className="mt-2 text-lg text-ink">{C.why.sub}</p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-5">
        {C.why.items.map((it, i) => (
          <div key={it.title} className="flex flex-col gap-4">
            <div className="relative aspect-square overflow-hidden max-w-full">
              <Photo img={images[i]} tone={LOUNGE_TONES[i % LOUNGE_TONES.length]} sizes="(max-width: 640px) 100vw, 33vw" />
            </div>
            <div className="flex gap-3">
              <span className="font-headline text-2xl text-ink leading-none pt-1">0{i + 1}</span>
              <div className="border-l border-ink pl-3 flex flex-col gap-1">
                <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-forest">{it.q}</p>
                <p className="font-headline uppercase text-2xl leading-none text-ink">{it.title}</p>
                <p className="text-sm text-ink">{it.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function PrintPicker({ products, lang }: { products: Product[]; lang: Locale }) {
  if (products.length === 0) return null
  return (
    <section className="border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-headline uppercase text-ink text-4xl sm:text-6xl leading-[0.95]">{C.prints.title}</h2>
            <p className="mt-2 text-lg text-ink">{C.prints.sub}</p>
          </div>
          <Link href={`/${lang}/products`} className="hidden sm:inline font-headline uppercase text-forest text-lg underline underline-offset-4 whitespace-nowrap">
            {C.prints.all} →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6">
          {products.map((p, i) => {
            const href = `/${lang}/products/${gidToNumericId(p.id)}`
            const price = p.priceRange.minVariantPrice
            return (
              <Link key={p.id} href={href} className="group flex flex-col items-center gap-3 min-w-0">
                <div className="relative aspect-[4/5] w-full overflow-hidden">
                  <Photo img={p.featuredImage ?? p.images.nodes[0]} tone={LOUNGE_TONES[i % LOUNGE_TONES.length]} sizes="(max-width: 640px) 50vw, 45vw" />
                </div>
                <p className="font-headline uppercase text-ink text-base sm:text-xl text-center leading-tight break-keep">
                  {stripTitlePrefix(p.title)}
                </p>
                <p className="text-sm text-ink -mt-1">{formatPrice(price.amount, price.currencyCode, lang)}</p>
                <span className="rounded-full border-2 border-forest px-5 py-2 font-headline uppercase text-forest text-sm tracking-[0.04em] group-hover:bg-forest group-hover:text-white transition-colors">
                  {C.prints.shop} →
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ClosingBanner({ lang, image }: { lang: Locale; image: Img }) {
  return (
    <section>
      <div className="relative aspect-[16/10] sm:aspect-[21/7] w-full overflow-hidden max-w-full">
        <Photo img={image} tone="bg-blush" sizes="100vw" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12">
          <p className="font-headline uppercase text-ink text-4xl sm:text-6xl leading-[0.92] max-w-[12ch]">{C.closing.title}</p>
          <p className="font-headline uppercase text-ink text-lg sm:text-2xl mt-2">{C.closing.sub}</p>
        </div>
      </div>
      <div className="bg-cream">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-center gap-5">
          <p className="font-headline uppercase text-ink text-3xl sm:text-5xl text-center leading-none">{C.closing.cta}</p>
          <CtaButton href={`/${lang}/products`}>{C.closing.button}</CtaButton>
        </div>
      </div>
    </section>
  )
}
