import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

// Supabase 무료 플랜 keep-alive.
// 무료 플랜은 7일간 활동(요청)이 없으면 프로젝트를 자동 일시정지(pause)한다.
// 정지되면 Q&A·반품·환불 등 Supabase 기반 기능이 전부 중단된다.
// → Vercel Cron이 매일 호출, 가벼운 read 1회로 활동을 발생시켜 정지를 막는다.
//   (기존 vbank-sweep cron은 Shopify/토스만 호출 → Supabase를 깨우지 못함. 전용 핑 필요.)
//
// CRON_SECRET이 설정돼 있으면 Authorization 헤더로 인증한다(외부 임의 호출 차단).

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  // 가벼운 read — 행을 가져오지 않고 count만(head: true). DB에 요청이 닿는 것 자체가 목적.
  const { error, count } = await supabaseAdmin
    .from('answer_templates')
    .select('id', { head: true, count: 'exact' })

  if (error) {
    console.error('[keep-alive] supabase ping failed:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, pinged: 'answer_templates', count: count ?? 0 })
}
