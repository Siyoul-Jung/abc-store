'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

type ImageData = { url: string; altText: string | null }

type Props = {
  images: ImageData[]
  title: string
  sizes?: string
}

export default function SwipeableProductImages({ images, title, sizes = '50vw' }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  // 카드 미리보기 정리:
  //  1) 사이즈표(altText="sizechart")는 제외 — 호버 미리보기엔 상품컷만 노출.
  //  2) 메이크샵 대표컷(그레이배경, 파일명 001…)이 0번이면 그 '무배경 쌍둥이'(1번)를 생략.
  //     대표컷은 첫 상품컷을 그레이배경으로 만든 거라, 안 빼면 같은 옷이 그레이/무배경으로 두 번 보임.
  const photos = images.filter((img) => img.url && img.altText !== 'sizechart')
  const hasCover = /\/0\d{5,}[._]/.test(photos[0]?.url ?? '')
  const deduped = hasCover ? [photos[0], ...photos.slice(2)] : photos
  const displayImages = deduped.slice(0, 3)

  function handleScroll() {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    setActiveIndex(Math.round(scrollLeft / clientWidth))
  }

  if (displayImages.length === 0) return <div className="w-full h-full bg-surface" />

  if (displayImages.length === 1) {
    return (
      <Image
        src={displayImages[0].url}
        alt={displayImages[0].altText ?? title}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-500"
      />
    )
  }

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayImages.map((img, i) => (
          <div key={i} className="snap-start shrink-0 w-full h-full relative">
            <Image
              src={img.url}
              alt={img.altText ?? title}
              fill
              sizes={sizes}
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* 실선 인디케이터 */}
      <div className="absolute bottom-0 left-0 right-0 flex z-10 pointer-events-none">
        {displayImages.map((_, i) => (
          <span
            key={i}
            className={`flex-1 h-[2px] transition-colors ${
              i === activeIndex ? 'bg-ink' : 'bg-ink/20'
            }`}
          />
        ))}
      </div>
    </>
  )
}
