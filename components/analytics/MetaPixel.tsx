'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Meta 브라우저 픽셀 베이스 — 전 스토어 페이지에 로드(레이아웃 마운트).
// 초기 PageView는 인라인 스니펫이 발화, 이후 SPA 라우트 변경마다 useEffect가 발화한다.
// 픽셀이 심는 _fbp/_fbc 쿠키는 서버 CAPI(confirm 라우트)가 읽어 매칭 품질도 함께 올린다.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function MetaPixel() {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    if (!PIXEL_ID) return
    if (first.current) {
      first.current = false // 초기 진입 PageView는 아래 스니펫이 이미 발화
      return
    }
    window.fbq?.('track', 'PageView')
  }, [pathname])

  if (!PIXEL_ID) return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
    </Script>
  )
}
