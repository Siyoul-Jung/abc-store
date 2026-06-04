import { notFound } from 'next/navigation'
import { hasLocale, getDictionary } from '../dictionaries'
import { getProducts } from '@/lib/shopify/storefront'
import type { Locale } from '@/lib/shopify/types'
import Hero from '@/components/home/Hero'
import ProductGrid from '@/components/home/ProductGrid'
import InstagramFeed from '@/components/home/InstagramFeed'
import Reveal from '@/components/ui/Reveal'

type Props = { params: Promise<{ lang: string }> }

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
