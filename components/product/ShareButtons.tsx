'use client'

import { useState } from 'react'
import Script from 'next/script'
import type { Locale } from '@/lib/shopify/types'

// 상품 공유 — 카카오톡(키 있을 때) + 네이티브 공유/링크복사 폴백.
// Kakao JS 키(NEXT_PUBLIC_KAKAO_JS_KEY)가 없으면 카카오 버튼은 렌더하지 않고 폴백만 노출.

type KakaoSDK = {
  isInitialized: () => boolean
  init: (key: string) => void
  Share: { sendDefault: (settings: unknown) => void }
}
declare global {
  interface Window { Kakao?: KakaoSDK }
}

type Props = {
  url: string
  title: string
  description: string
  imageUrl?: string
  locale: Locale
}

const t: Record<Locale, { kakao: string; copy: string; copied: string }> = {
  ko: { kakao: '카카오톡 공유', copy: '링크 복사', copied: '복사됨!' },
  ja: { kakao: 'カカオで共有', copy: 'リンクをコピー', copied: 'コピーしました！' },
  en: { kakao: 'Share on Kakao', copy: 'Copy link', copied: 'Copied!' },
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY

export default function ShareButtons({ url, title, description, imageUrl, locale }: Props) {
  const [copied, setCopied] = useState(false)
  const [kakaoReady, setKakaoReady] = useState(false)
  const d = t[locale]

  function initKakao() {
    if (KAKAO_KEY && window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_KEY)
    }
    setKakaoReady(Boolean(window.Kakao?.isInitialized()))
  }

  function shareKakao() {
    if (!window.Kakao?.isInitialized()) return
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl: imageUrl ?? '',
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [{ title: locale === 'ja' ? '商品を見る' : '상품 보기', link: { mobileWebUrl: url, webUrl: url } }],
    })
  }

  async function shareGeneric() {
    // 모바일은 네이티브 공유 시트, 데스크톱은 클립보드 복사로 폴백
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url })
        return
      } catch {
        // 사용자가 취소한 경우 등 — 조용히 무시
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard 미지원 — 아무 동작 없음
    }
  }

  return (
    <div className="flex items-center gap-2">
      {KAKAO_KEY && (
        <Script
          src="https://t1.kakao.com/kakao_js_sdk/2.7.4/kakao.min.js"
          onLoad={initKakao}
        />
      )}
      {KAKAO_KEY && (
        <button
          type="button"
          onClick={shareKakao}
          disabled={!kakaoReady}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border hover:border-ink transition-colors disabled:opacity-50"
        >
          <span className="w-4 h-4 rounded-full bg-[#FEE500] flex items-center justify-center text-[10px]">K</span>
          {d.kakao}
        </button>
      )}
      <button
        type="button"
        onClick={shareGeneric}
        className="px-3 py-2 text-xs font-medium border border-border hover:border-ink transition-colors"
      >
        {copied ? d.copied : d.copy}
      </button>
    </div>
  )
}
