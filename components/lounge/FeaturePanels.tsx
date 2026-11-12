import Image from 'next/image'
import type { Locale } from '@/lib/shopify/types'
import { LOUNGE_TONES, loungeCopy } from './copy'
import { ValueBand } from './HomeSections'

type Img = { url: string; altText?: string | null }

// 상품 상세 하단(adult 상품 전용) — 장점 띠 → 큰 문구 블록 → 01·02·03 패널.
// 패널은 왼쪽 문구 / 오른쪽 이미지(없으면 프린트 톤 블록). 01·02는 데스크톱 2열, 03은 전체폭(초록 배경).
export default function FeaturePanels({ locale, images }: { locale: Locale; images: Img[] }) {
  const C = loungeCopy(locale)
  // 상품컷은 앞 2장만 사용 — 뒤쪽은 보통 사이즈표·상세컷이라 패널에 부적합.
  const blockImage = images[0]
  const panelImages = [images[1]]
  const { block } = C.pdp
  return (
    <section className="mt-12 sm:mt-16">
      <ValueBand icons />
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] bg-cream">
        <div className="p-5 sm:p-10 flex flex-col justify-center gap-3">
          <p className="font-headline uppercase text-forest leading-[0.95] text-[27px] sm:text-[64px]">
            {block.title.map((line) => <span key={line} className="block">{line}</span>)}
          </p>
          <p className="text-sm sm:text-lg text-forest break-keep">{block.body}</p>
          <p className="text-sm sm:text-lg font-semibold text-forest">{block.kicker}</p>
        </div>
        <div className="relative min-h-[260px] sm:min-h-[420px] bg-sky">
          {blockImage && <Image src={blockImage.url} alt={blockImage.altText ?? ''} fill sizes="(max-width: 768px) 40vw, 30vw" className="object-cover" />}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2">
        {C.features.map((f, i) => {
          const last = i === C.features.length - 1
          const tone = last ? 'bg-forest' : LOUNGE_TONES[i % LOUNGE_TONES.length]
          const img = panelImages[i]
          return (
            <div key={f.no} className={`grid grid-cols-2 min-h-[220px] sm:min-h-[300px] ${last ? 'md:col-span-2' : ''}`}>
              <div className={`${tone} ${last ? 'text-white' : 'text-ink'} p-5 sm:p-8 flex flex-col justify-between gap-4`}>
                <p className="font-headline uppercase leading-[0.9] text-[40px] sm:text-[64px]">
                  {f.no}
                  <br />
                  {f.title}
                </p>
                <p className="text-sm sm:text-base">{f.body}</p>
              </div>
              <div className={`relative ${last ? 'bg-sun' : tone}`}>
                {img && <Image src={img.url} alt={img.altText ?? ''} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
