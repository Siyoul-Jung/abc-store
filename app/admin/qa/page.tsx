import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { getAdminQuestions } from '@/lib/actions/qa'

export default async function AdminQaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>
}) {
  // 어드민 비밀번호 검증
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  if (adminAuth !== process.env.ADMIN_SECRET) redirect('/admin/login')

  const { status = 'pending', category = 'all' } = await searchParams
  const questions = await getAdminQuestions(status, category)

  const pendingCount = questions.filter((q) => q.status === 'pending').length

  const categories = ['all', 'shipping', 'return', 'refund', 'product', 'other']
  const categoryLabels: Record<string, string> = {
    all: '전체', shipping: '배송', return: '교환/반품', refund: '환불', product: '상품', other: '기타',
  }
  const statusLabels: Record<string, string> = { pending: '답변대기', answered: '답변완료', all: '전체' }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">고객 문의 관리</h1>
        {pendingCount > 0 && (
          <span className="bg-coral text-white text-xs font-medium px-2.5 py-1 rounded-full">
            답변대기 {pendingCount}건
          </span>
        )}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['pending', 'answered', 'all'].map((s) => (
          <Link key={s}
            href={`/admin/qa?status=${s}&category=${category}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              status === s ? 'border-ink bg-ink text-white' : 'border-border text-ink-muted hover:border-ink-muted'
            }`}>
            {statusLabels[s]}
          </Link>
        ))}
        <span className="border-l border-border mx-1" />
        {categories.map((c) => (
          <Link key={c}
            href={`/admin/qa?status=${status}&category=${c}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              category === c ? 'border-ink bg-ink text-white' : 'border-border text-ink-muted hover:border-ink-muted'
            }`}>
            {categoryLabels[c]}
          </Link>
        ))}
      </div>

      {/* 목록 */}
      <div className="border-t border-border">
        {questions.length === 0 ? (
          <p className="text-sm text-ink-muted py-12 text-center">문의가 없습니다.</p>
        ) : (
          questions.map((q) => {
            const hasRefund = q.refund_requests && q.refund_requests.length > 0
            const refundStatus = hasRefund ? q.refund_requests[0].status : null
            return (
              <Link key={q.id} href={`/admin/qa/${q.id}`}
                className="flex items-start gap-4 py-4 border-b border-border hover:bg-surface/50 -mx-2 px-2 rounded transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 bg-surface border border-border rounded text-ink-muted">
                      {categoryLabels[q.category] ?? q.category}
                    </span>
                    {q.is_private && <span className="text-[10px] text-ink-muted">🔒</span>}
                    {hasRefund && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        refundStatus === 'completed' ? 'bg-green-50 text-green-700' :
                        refundStatus === 'processing' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {refundStatus === 'completed' ? '환불완료' : refundStatus === 'processing' ? '처리중' : '환불대기'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{q.title}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {q.customer_name} · {new Date(q.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span className={`text-[11px] font-medium shrink-0 mt-0.5 ${
                  q.status === 'answered' ? 'text-ink-muted' : 'text-coral'
                }`}>
                  {statusLabels[q.status]}
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
