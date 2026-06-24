import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getQuestion, getAnswerTemplates } from '@/lib/actions/qa'
import { adminGql } from '@/lib/shopify/admin'
import AdminAnswerForm from './_components/AdminAnswerForm'
import AdminRefundPanel from './_components/AdminRefundPanel'

const CUSTOMER_ORDERS_QUERY = `
  query GetCustomerOrders($email: String!) {
    customers(first: 1, query: $email) {
      edges {
        node {
          orders(first: 5, sortKey: CREATED_AT, reverse: true) {
            edges {
              node {
                id name createdAt
                totalPriceSet { shopMoney { amount currencyCode } }
                displayFinancialStatus displayFulfillmentStatus
                lineItems(first: 3) {
                  edges { node { title quantity } }
                }
              }
            }
          }
        }
      }
    }
  }
`

export type ShopifyOrder = {
  id: string; name: string; createdAt: string
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } }
  displayFinancialStatus: string; displayFulfillmentStatus: string
  lineItems: { edges: { node: { title: string; quantity: number } }[] }
}

export default async function AdminQaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const adminAuth = cookieStore.get('admin_auth')?.value
  if (adminAuth !== process.env.ADMIN_SECRET) redirect('/admin/login')

  const { id } = await params
  const [question, templates] = await Promise.all([
    getQuestion(id),
    getAnswerTemplates(),
  ])
  if (!question) notFound()

  // Shopify에서 고객 주문 내역 조회
  let orders: ShopifyOrder[] = []
  if (question.customer_email) {
    try {
      const { data } = await adminGql<{ customers: { edges: { node: { orders: { edges: { node: ShopifyOrder }[] } } }[] } }>(
        CUSTOMER_ORDERS_QUERY,
        { email: `email:${question.customer_email}` }
      )
      orders = data?.customers?.edges?.[0]?.node?.orders?.edges?.map((e) => e.node) ?? []
    } catch {
      // 주문 조회 실패해도 페이지는 표시
    }
  }

  const answer = question.answers?.[0]
  const refundRequest = question.refund_requests?.[0]

  const categoryLabels: Record<string, string> = {
    shipping: '배송', return: '교환/반품', defective: '불량/오배송', refund: '환불', product: '상품', other: '기타',
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        <a href="/admin/qa" className="text-sm text-ink-muted hover:text-ink transition-colors">← 목록</a>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
          question.status === 'answered' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {question.status === 'answered' ? '답변완료' : '답변대기'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* 왼쪽: 질문 + 답변 */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* 질문 */}
          <div className="border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-ink-muted">
                {categoryLabels[question.category] ?? question.category}
              </span>
              {question.is_private && <span className="text-xs text-ink-muted">🔒 비공개</span>}
            </div>
            <h2 className="font-semibold mb-1">{question.title}</h2>
            <p className="text-xs text-ink-muted mb-4">
              {question.customer_name} · {question.customer_email} · {new Date(question.created_at).toLocaleString('ko-KR')}
            </p>
            {question.order_number && (
              <p className="text-xs text-ink-muted mb-3">주문번호: <span className="font-medium text-ink">{question.order_number}</span></p>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-surface rounded-lg p-4">{question.content}</p>
          </div>

          {/* 기존 답변 or 답변 작성 */}
          {answer ? (
            <div className="border border-green-200 bg-green-50/30 rounded-xl p-5">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-green-700 mb-3">답변</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer.content}</p>
              <p className="text-xs text-ink-muted mt-3">{new Date(answer.created_at).toLocaleString('ko-KR')}</p>
            </div>
          ) : (
            <AdminAnswerForm questionId={id} templates={templates} questionCategory={question.category} />
          )}
        </div>

        {/* 오른쪽: 고객 주문 내역 + 환불 */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* 고객 주문 내역 */}
          <div className="border border-border rounded-xl p-5">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-4">고객 주문 내역</p>
            {orders.length === 0 ? (
              <p className="text-xs text-ink-muted">주문 내역이 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border rounded-lg p-3 text-xs">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-medium">{order.name}</span>
                      <span className="text-ink-muted">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <p className="text-ink-muted mb-1 truncate">
                      {order.lineItems.edges.map((e) => `${e.node.title} ×${e.node.quantity}`).join(', ')}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {Number(order.totalPriceSet.shopMoney.amount).toLocaleString()}원
                      </span>
                      <span className="text-ink-muted">{order.displayFulfillmentStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 환불 처리 패널 */}
          <AdminRefundPanel
            questionId={id}
            customerName={question.customer_name}
            customerEmail={question.customer_email}
            defaultOrderNumber={question.order_number ?? ''}
            refundRequest={refundRequest ?? null}
          />

        </div>
      </div>
    </div>
  )
}
