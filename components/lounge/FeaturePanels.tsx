import Image from 'next/image'
import { LOUNGE_COPY as C, LOUNGE_TONES } from './copy'
import { ValueBand } from './HomeSections'

type Img = { url: string; altText?: string | null }

// 상품 상세 하단 01·02·03 장점 패널 — 왼쪽 문구 / 오른쪽 이미지(없으면 프린트 톤 블록).
// 01·02는 데스크톱 2열, 03은 전체폭(초록 배경).
export default function FeaturePanels({ images }: { images: Img[] }) {
  return (
    <section className="mt-12 sm:mt-16">
      <ValueBand />
      <div className="grid grid-cols-1 md:grid-cols-2">
        {C.features.map((f, i) => {
          const last = i === C.features.length - 1
          const tone = last ? 'bg-forest' : LOUNGE_TONES[i % LOUNGE_TONES.length]
          // 상품컷은 앞 2장만 사용 — 뒤쪽은 보통 사이즈표·상세컷이라 패널에 부적합. 03은 색 블록.
          const img = last ? undefined : images[i]
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
