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

  // 카드에선 최대 3장
  const displayImages = images.slice(0, 3).filter((img) => img.url)

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
