'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import type { Image as ShopifyImage } from '@/lib/shopify/types'

export default function ProductImageGallery({
  images,
  title,
  featuredUrl,
}: {
  images: ShopifyImage[]
  title: string
  featuredUrl?: string
}) {
  // 메인 목록 대표컷(그레이 배경 maximage, 파일명 001…)만 상세 갤러리에서 제외 — 상세는 흰배경 상세컷만 노출.
  // 그레이 대표컷이 없는 상품은 featured가 진짜 대표 상품컷이므로 제외하지 않는다(썸네일=상세 1번 일치).
  const isCover = (url?: string) => !!url && /\/0\d{5,}[._]/.test(url)
  const gallery = isCover(featuredUrl) ? images.filter((i) => i.url !== featuredUrl) : images
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)

  const prev = () => setActive((i) => (i - 1 + gallery.length) % gallery.length)
  const next = () => setActive((i) => (i + 1) % gallery.length)

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
  }, [zoom, gallery.length])

  if (gallery.length === 0) {
    return (
      <div className="aspect-[3/4] bg-sand flex items-center justify-center">
        <span className="text-xs text-ink-muted">No image</span>
      </div>
    )
  }

  // 가로로 긴 이미지(사이즈표 등)는 contain(전체), 정사각·세로(제품컷)는 cover(꽉)
  const activeImg = gallery[active]
  const fitClass = activeImg.width > activeImg.height ? 'object-contain' : 'object-cover'

  const thumbnailButtons = gallery.map((img, i) => (
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
        {gallery.length > 1 && (
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
            src={gallery[active].url}
            alt={gallery[active].altText ?? title}
            fill
            sizes="50vw"
            className={fitClass}
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
            src={gallery[active].url}
            alt={gallery[active].altText ?? title}
            fill
            sizes="100vw"
            className={fitClass}
            priority
          />
        </button>
        {gallery.length > 1 && (
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

            <div
              className="relative w-full h-full max-w-5xl max-h-[88vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={gallery[active].url}
                alt={gallery[active].altText ?? title}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {gallery.length > 1 && (
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
                  {active + 1} / {gallery.length}
                </span>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
