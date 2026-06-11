import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

// 반품 신청 목록 CSV 다운로드 — 배송팀/환불 담당에게 파일로 전달하기 위한 내보내기.
// /admin/returns 의 현재 status 필터를 그대로 반영한다. 관리자 인증 필수.

const reasonLabels: Record<string, string> = {
  SIZE_TOO_SMALL: '사이즈 작음', SIZE_TOO_LARGE: '사이즈 큼',
  WRONG_ITEM: '오배송', DEFECTIVE: '불량/파손',
  NOT_AS_DESCRIBED: '상품 상이', UNWANTED: '단순변심', OTHER: '기타',
}

const statusLabels: Record<string, string> = {
  pending: '처리대기', approved: '수거승인', received: '수령완료', completed: '환불완료',
}

// CSV 한 셀 escaping: 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감싸고 내부 따옴표는 2개로.
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: NextRequest) {
  // 관리자 인증 (페이지와 동일한 쿠키 검증)
  if (req.cookies.get('admin_auth')?.value !== process.env.ADMIN_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const status = req.nextUrl.searchParams.get('status') ?? 'pending'

  let query = supabaseAdmin
    .from('return_requests')
    .select('created_at, order_number, customer_name, status, reason, items_json, bank_name, account_number, account_holder, refund_amount, note')
    .order('created_at', { ascending: false })

  if (status !== 'all') query = query.eq('status', status)
  const { data: rows, error } = await query

  if (error) {
    console.error('[returns/export] supabase error:', error.message)
    return new NextResponse('Internal Server Error', { status: 500 })
  }

  const headers = [
    '신청일', '주문번호', '고객명', '상태', '사유', '반품상품',
    '환불은행', '환불계좌', '예금주', '환불금액', '메모',
  ]

  const lines = [headers.join(',')]
  for (const r of rows ?? []) {
    lines.push([
      new Date(r.created_at).toLocaleString('ko-KR'),
      r.order_number,
      r.customer_name,
      statusLabels[r.status] ?? r.status,
      reasonLabels[r.reason] ?? r.reason,
      r.items_json,
      r.bank_name,
      r.account_number,
      r.account_holder,
      r.refund_amount,
      r.note,
    ].map(csvCell).join(','))
  }

  // Excel 한글 호환을 위해 UTF-8 BOM(﻿) 선두에 부착
  const csv = '﻿' + lines.join('\r\n')

  // 파일명: returns-<status>-YYYYMMDD.csv
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `returns-${status}-${today}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
