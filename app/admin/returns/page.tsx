import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/client'
import AdminReturnActions from './_components/AdminReturnActions'

const reasonLabels: Record<string, string> = {
  SIZE_TOO_SMALL: '사이즈 작음', SIZE_TOO_LARGE: '사이즈 큼',
  WRONG_ITEM: '오배송', DEFECTIVE: '불량/파손',
  NOT_AS_DESCRIBED: '상품 상이', UNWANTED: '단순변심', OTHER: '기타',
}

const statusLabels: Record<string, string> = {
  pending: '처리대기', approved: '수거승인', received: '수령완료', completed: '환불완료',
}

const statusColors: Record<string, string> = {
  pending: 'text-red-600 bg-red-50',
  approved: 'text-blue-700 bg-blue-50',
  received: 'text-yellow-700 bg-yellow-50',
  completed: 'text-green-700 bg-green-50',
}

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const cookieStore = await cookies()
  if (cookieStore.get('admin_auth')?.value !== process.env.ADMIN_SECRET) {
    redirect('/admin/login')
  }

  const { status = 'pending' } = await searchParams

  let query = supabaseAdmin
    .from('return_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status !== 'all') query = query.eq('status', status)
  const { data: returns } = await query

  const pendingCount = await supabaseAdmin
    .from('return_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <a href="/admin/qa" className="text-sm text-ink-muted hover:text-ink transition-colors">← Q&A</a>
          <h1 className="text-xl font-semibold">반품 관리</h1>
        </div>
        {(pendingCount.count ?? 0) > 0 && (
          <span className="bg-coral text-white text-xs font-medium px-2.5 py-1 rounded-full">
            처리대기 {pendingCount.count}건
          </span>
        )}
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['pending', 'approved', 'received', 'completed', 'all'].map((s) => (
          <a key={s} href={`/admin/returns?status=${s}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              status === s ? 'border-ink bg-ink text-white' : 'border-border text-ink-muted hover:border-ink-muted'
            }`}>
            {s === 'all' ? '전체' : statusLabels[s]}
          </a>
        ))}
      </div>

      {/* 목록 */}
      <div className="flex flex-col gap-3">
        {!returns?.length ? (
          <p className="text-sm text-ink-muted py-12 text-center">반품 신청이 없습니다.</p>
        ) : (
          returns.map((r) => (
            <div key={r.id} className="border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{r.order_number}</span>
                    <span className="text-xs text-ink-muted">·</span>
                    <span className="text-xs text-ink-muted">{r.customer_name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusColors[r.status]}`}>
                      {statusLabels[r.status]}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    {reasonLabels[r.reason] ?? r.reason} · {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>

              {/* 반품 상품 */}
              <p className="text-xs bg-surface rounded-lg px-3 py-2 mb-3">{r.items_json}</p>

              {/* 환불 계좌 */}
              {r.bank_name && (
                <div className="flex gap-4 text-xs mb-3 p-3 border border-border rounded-lg">
                  <span className="text-ink-muted">환불계좌</span>
                  <span className="font-medium">{r.bank_name} {r.account_number} ({r.account_holder})</span>
                </div>
              )}

              {/* 메모 */}
              {r.note && (
                <p className="text-xs text-ink-muted mb-3">"{r.note}"</p>
              )}

              {/* 어드민 액션 */}
              <AdminReturnActions returnId={r.id} status={r.status} hasBankInfo={!!r.bank_name} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
