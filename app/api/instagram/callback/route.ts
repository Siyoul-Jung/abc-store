import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }
  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 })
  }

  // 단기 토큰 발급
  const shortRes = await fetch('https://graph.instagram.com/v20.0/oauth/access_token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id:    process.env.INSTAGRAM_CLIENT_ID!,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
      grant_type:   'authorization_code',
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
      code,
    }),
  })
  const shortData = await shortRes.json()
  if (!shortData.access_token) {
    return NextResponse.json({ error: '단기 토큰 발급 실패', detail: shortData }, { status: 500 })
  }

  // 장기 토큰으로 교환 (60일)
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${shortData.access_token}`
  )
  const longData = await longRes.json()
  if (!longData.access_token) {
    return NextResponse.json({ error: '장기 토큰 발급 실패', detail: longData }, { status: 500 })
  }

  // 사용자 ID 조회
  const meRes  = await fetch(`https://graph.instagram.com/me?access_token=${longData.access_token}`)
  const meData = await meRes.json()

  return NextResponse.json({
    message: '아래 값을 .env.local에 추가하세요',
    INSTAGRAM_ACCESS_TOKEN: longData.access_token,
    INSTAGRAM_USER_ID: meData.id,
    expires_in_days: Math.floor(longData.expires_in / 86400),
  })
}
