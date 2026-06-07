'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [zoom, setZoom] = useState(false)

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length)
  const next = () => setActive((i) => (i + 1) % images.length)

  // 라이트박스: 스크롤 잠금 + 키보드(ESC/←/→)
  useEffect(() => {
    if (!zoom) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false)
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, images.length])

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
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="이미지 확대"
          className="relative aspect-[3/4] overflow-hidden flex-1 cursor-zoom-in"
        >
          <Image
            src={images[active].url}
            alt={images[active].altText ?? title}
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
        </button>
      </div>

      {/* 모바일: 상단 메인 이미지 + 하단 썸네일 가로 스크롤 */}
      <div className="flex flex-col gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="이미지 확대"
          className="relative aspect-[3/4] overflow-hidden cursor-zoom-in"
        >
          <Image
            src={images[active].url}
            alt={images[active].altText ?? title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </button>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {thumbnailButtons}
          </div>
        )}
      </div>

      {/* 라이트박스 (전체화면 크게 보기) */}
      {zoom &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center"
            onClick={() => setZoom(false)}
          >
            {/* 닫기 */}
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setZoom(false)}
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </svg>
            </button>

            {/* 이미지 (전체, 잘리지 않게) */}
            <div
              className="relative w-full h-full max-w-5xl max-h-[88vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[active].url}
                alt={images[active].altText ?? title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {/* 이전/다음 + 카운터 */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="이전"
                  onClick={(e) => { e.stopPropagation(); prev() }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="다음"
                  onClick={(e) => { e.stopPropagation(); next() }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-xs">
                  {active + 1} / {images.length}
                </span>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
