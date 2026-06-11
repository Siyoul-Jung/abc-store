'use client'

import { useEffect, useRef } from 'react'

// 다음(카카오) 우편번호 검색 모달 — 무료, API 키 불필요.
// 한국 사용자는 우편번호를 직접 모르는 게 보통이라 검색이 표준 UX.
// 스크립트는 CheckoutForm에서 로드하고, 이 모달은 embed만 담당한다.

type PostcodeData = {
  zonecode: string // 5자리 우편번호
  roadAddress: string
  jibunAddress: string
  buildingName?: string
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: PostcodeData) => void
        width?: string | number
        height?: string | number
      }) => { embed: (el: HTMLElement) => void }
    }
  }
}

type Props = {
  onSelect: (zipcode: string, address: string) => void
  onClose: () => void
}

export default function AddressSearchModal({ onSelect, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !window.daum) return
    new window.daum.Postcode({
      oncomplete: (data) => {
        const address =
          data.roadAddress + (data.buildingName ? ` (${data.buildingName})` : '')
        onSelect(data.zonecode, address || data.jibunAddress)
      },
      width: '100%',
      height: '100%',
    }).embed(containerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ESC 닫기 + 배경 스크롤 블락 (PolicyModal과 동일한 동작)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md h-[480px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">주소 검색</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-ink-muted hover:text-ink text-xl leading-none px-1"
          >
            ×
          </button>
        </div>
        <div ref={containerRef} className="flex-1" />
      </div>
    </div>
  )
}
