import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { checkLowStockAndAlert } from '@/lib/shopify/low-stock'

// 매일 1회 도는 유지보수 cron — 두 가지 일을 한다(Vercel Hobby cron 2개 제한 회피).
//  ① Supabase keep-alive: 무료 플랜은 7일 무활동 시 프로젝트를 자동 일시정지(pause)한다.
//     정지되면 Q&A·반품·환불 등 Supabase 기능이 전부 중단 → 가벼운 read 1회로 활동을 발생시켜 막는다.
//     (vbank-sweep cron은 Shopify/토스만 호출해 Supabase를 못 깨움 → 전용 핑 필요.)
//  ② 저재고 점검: Shopify Admin 재고를 조회해 임계값 이하 품목을 관리자에게 메일 보고(lib/shopify/low-stock).
//     ②가 실패해도 ①(정지 방지)은 반드시 수행돼야 하므로 try/catch로 격리한다.
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

  // ② 저재고 점검 — 실패해도 keep-alive 본업은 성공으로 응답(격리).
  let lowStock: { threshold: number; count: number } | { error: string }
  try {
    lowStock = await checkLowStockAndAlert()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[keep-alive] low-stock check failed:', msg)
    lowStock = { error: msg }
  }

  return NextResponse.json({ ok: true, pinged: 'answer_templates', count: count ?? 0, lowStock })
}
