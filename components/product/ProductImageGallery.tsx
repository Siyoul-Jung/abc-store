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

  return (
    <div className="flex flex-col gap-3">
      {/* 메인 이미지 */}
      <div className="relative aspect-[3/4] overflow-hidden bg-cream">
        <Image
          src={images[active].url}
          alt={images[active].altText ?? title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* 썸네일 */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-16 aspect-square overflow-hidden bg-cream border transition-colors ${
                i === active ? 'border-ink' : 'border-transparent hover:border-stone'
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${title} ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
