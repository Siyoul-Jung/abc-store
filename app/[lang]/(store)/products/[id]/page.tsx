import { notFound } from 'next/navigation'
import { unstable_noStore } from 'next/cache'
import type { Metadata } from 'next'
import { hasLocale, getDictionary } from '../../../dictionaries'
import { getProductById, getProductMetafields, numericIdToGid, getProducts } from '@/lib/shopify/storefront'
import { stripHtml, stripTitlePrefix, gidToNumericId } from '@/lib/utils/format'
import ProductImageGallery from '@/components/product/ProductImageGallery'
import VariantSelector from '@/components/product/VariantSelector'
import ProductDisclosure from '@/components/product/ProductDisclosure'
import ProductGrid from '@/components/home/ProductGrid'
import type { Locale, Product } from '@/lib/shopify/types'

const BASE = 'https://applebuttercollege.com'

function buildProductJsonLd(product: Product, lang: Locale, id: string) {
  const numId = gidToNumericId(product.id)
  const available = product.variants.nodes.some((v) => v.availableForSale)
  const price = product.priceRange.minVariantPrice
  const images = product.images.nodes.map((img) => img.url)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: stripTitlePrefix(product.title),
    description: product.description,
    image: images,
    url: `${BASE}/${lang}/products/${numId}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: price.currencyCode,
      price: price.amount,
      availability: available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${BASE}/${lang}/products/${numId}`,
    },
  }
}

type Props = { params: Promise<{ lang: string; id: string }> }


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params
  if (!hasLocale(lang)) return {}
  const product = await getProductById(id, lang as Locale)
  if (!product) return {}
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      images: product.featuredImage ? [product.featuredImage.url] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  unstable_noStore()
  const { lang, id } = await params
  if (!hasLocale(lang)) notFound()

  const [product, dict, metafields, allProducts] = await Promise.all([
    getProductById(id, lang as Locale),
    getDictionary(lang as Locale),
    getProductMetafields(numericIdToGid(id)),
    getProducts(lang as Locale, 20),
  ])

  if (!product) notFound()

  const firstVariant = product.variants.nodes[0]
  const recommended = allProducts
    .filter((p) => p.id !== product.id && p.variants.nodes.some((v) => v.availableForSale))
    .sort(() => Math.random() - 0.5)
    .slice(0, 6)

  const jsonLd = buildProductJsonLd(product, lang as Locale, id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 상단: 이미지 좌 | 제목+가격+사이즈 우
          items-start: 그리드 기본 stretch를 끔 — 우측 아코디언 펼침 시 좌측 이미지가
          행 높이에 맞춰 늘어나(object-cover 확대) 보이던 문제 방지. 각 컬럼은 자기 높이로. */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-10 lg:gap-16 items-start">

        <ProductImageGallery images={product.images.nodes} title={product.title} />

        <div className="flex flex-col gap-5">
          <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight break-keep">
            {stripTitlePrefix(product.title)}
          </h1>

          <VariantSelector
            variants={product.variants.nodes}
            locale={lang as Locale}
            addToCartLabel={dict.product.addToCart}
            soldOutLabel={dict.product.soldOut}
            sizeGuideLabel={dict.product.sizeGuide}
            freeShippingNotice={dict.product.freeShippingNotice}
            descriptionHtml={product.descriptionHtml ? stripHtml(product.descriptionHtml) : undefined}
            careInstructions={metafields.careInstructions ?? undefined}
            shippingNotice={metafields.shippingNotice ?? undefined}
            initialPrice={firstVariant.price}
            initialCompareAtPrice={firstVariant.compareAtPrice}
          />

          {/* 상품정보제공고시 + KC 표시 — 한국 판매분 법적 고지 (ko 전용) */}
          {lang === 'ko' && <ProductDisclosure />}
        </div>

      </div>

      {recommended.length > 0 && (
        <div className="mt-16 md:border-t md:border-border">
          <ProductGrid
            products={recommended}
            lang={lang as Locale}
            title={dict.product.recommended}
          />
        </div>
      )}

    </div>
  )
}
