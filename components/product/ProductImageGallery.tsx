'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Image as ShopifyImage } from '@/lib/shopify/types'

export default function ProductImageGallery({
  images,
  title,
}: {
  images: ShopifyImage[]
  title: string
}) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-sand flex items-center justify-center">
        <span className="text-xs text-ink-muted">No image</span>
      </div>
    )
  }

  const thumbnailButtons = images.map((img, i) => (
    <button
      key={img.url}
      onClick={() => setActive(i)}
      className={`relative shrink-0 overflow-hidden border transition-colors
        w-16 aspect-[3/4]
        ${i === active ? 'border-ink' : 'border-transparent hover:border-stone'}`}
    >
      <Image
        src={img.url}
        alt={img.altText ?? `${title} ${i + 1}`}
        fill
        sizes="64px"
        className="object-cover"
      />
    </button>
  ))

  return (
    <>
      {/* 데스크탑: 좌측 썸네일 세로 + 우측 메인 이미지 */}
      <div className="hidden md:flex gap-3">
        {images.length > 1 && (
          <div className="flex flex-col gap-2 w-16 shrink-0 overflow-y-auto max-h-[700px]">
            {thumbnailButtons}
          </div>
        )}
        <div className="relative aspect-[3/4] overflow-hidden flex-1">
          <Image
            src={images[active].url}
            alt={images[active].altText ?? title}
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* 모바일: 상단 메인 이미지 + 하단 썸네일 가로 스크롤 */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={images[active].url}
            alt={images[active].altText ?? title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {thumbnailButtons}
          </div>
        )}
      </div>
    </>
  )
}
