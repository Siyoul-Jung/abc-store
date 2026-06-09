import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { hasLocale } from '../../../dictionaries'
import type { Locale } from '@/lib/shopify/types'

// 결제 완료 표시 페이지 — 부수효과 없음(순수 렌더). 새로고침해도 안전.
// 실제 결제확인·주문생성은 /api/checkout/confirm 라우트 핸들러가 처리하고,
// 여기서는 그곳이 심어둔 order_confirmation 쿠키만 읽어 표시한다.

type ConfirmationPayload = {
  orderName: string
  isVbank: boolean
  amount: number
  vbank: { bankName: string; accountNumber: string; dueDate: string } | null
  shipping: { name: string; address: string; addressDetail: string } | null
  items: { title: string; variantTitle: string; quantity: number; lineTotal: number }[]
}

type Props = { params: Promise<{ lang: string }> }

const t: Record<Locale, {
  titleCard: string; titleVbank: string
  orderNum: string
  items: string; total: string; shippingAddr: string
  depositGuide: string; depositBank: string; depositAccount: string; depositAmount: string; depositDue: string
  depositNote: string
  continueShopping: string
}> = {
  ko: {
    titleCard: '주문이 완료되었습니다',
    titleVbank: '입금 계좌를 확인해 주세요',
    orderNum: '주문번호',
    items: '주문 상품',
    total: '결제 금액',
    shippingAddr: '배송지',
    depositGuide: '아래 계좌로 입금하시면 주문이 확정됩니다.',
    depositBank: '은행',
    depositAccount: '계좌번호',
    depositAmount: '입금 금액',
    depositDue: '입금 기한',
    depositNote: '입금자명은 주문자명과 동일하게 입력해 주세요.',
    continueShopping: '쇼핑 계속하기',
  },
  ja: {
    titleCard: 'ご注文が完了しました',
    titleVbank: '振込先口座をご確認ください',
    orderNum: '注文番号',
    items: 'ご注文商品',
    total: 'お支払い金額',
    shippingAddr: 'お届け先',
    depositGuide: '下記の口座へお振込みいただくとご注文が確定します。',
    depositBank: '銀行名',
    depositAccount: '口座番号',
    depositAmount: 'お振込み金額',
    depositDue: '振込期限',
    depositNote: '振込名義はご注文者名と同じにしてください。',
    continueShopping: 'ショッピングを続ける',
  },
  en: {
    titleCard: 'Order Confirmed',
    titleVbank: 'Please complete your bank transfer',
    orderNum: 'Order',
    items: 'Items',
    total: 'Total',
    shippingAddr: 'Ship to',
    depositGuide: 'Your order will be confirmed once we receive your payment.',
    depositBank: 'Bank',
    depositAccount: 'Account Number',
    depositAmount: 'Amount',
    depositDue: 'Due Date',
    depositNote: 'Please use your name as the transfer reference.',
    continueShopping: 'Continue Shopping',
  },
}

export default async function CheckoutCompletePage({ params }: Props) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale

  const cookieStore = await cookies()
  const raw = cookieStore.get('order_confirmation')?.value
  // 확정 정보가 없으면(직접 진입·만료) 홈으로
  if (!raw) redirect(`/${lang}`)

  let order: ConfirmationPayload
  try {
    order = JSON.parse(decodeURIComponent(raw))
  } catch {
    redirect(`/${lang}`)
  }

  const d = t[locale]
  const { isVbank, vbank, shipping, items, amount, orderName } = order!

  return (
    <section className="max-w-lg mx-auto px-4 py-16 sm:py-24 flex flex-col items-center gap-6">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${isVbank ? 'bg-surface' : 'bg-citrus'}`}>
        {isVbank ? '💳' : '✓'}
      </div>

      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-base font-semibold break-keep">{isVbank ? d.titleVbank : d.titleCard}</h1>
        {orderName && (
          <p className="text-sm text-ink-muted">{d.orderNum}: {orderName}</p>
        )}
      </div>

      {/* 주문 요약 */}
      {items.length > 0 && (
        <div className="w-full border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-surface">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted">{d.items}</p>
          </div>
          <div className="divide-y divide-border">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-start px-5 py-3 text-sm">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="truncate">{item.title}</p>
                  {item.variantTitle && (
                    <p className="text-xs text-ink-muted mt-0.5">{item.variantTitle}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-ink-muted text-xs">×{item.quantity}</p>
                  <p className="font-medium">{item.lineTotal.toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-5 py-3 border-t border-border bg-surface">
            <span className="text-sm font-semibold">{d.total}</span>
            <span className="text-sm font-semibold">{amount.toLocaleString()}원</span>
          </div>
        </div>
      )}

      {/* 배송지 */}
      {shipping && (
        <div className="w-full border border-border rounded-xl px-5 py-4">
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-2">{d.shippingAddr}</p>
          <p className="text-sm">{shipping.name}</p>
          <p className="text-sm text-ink-muted">{shipping.address} {shipping.addressDetail}</p>
        </div>
      )}

      {/* 가상계좌 입금 안내 */}
      {isVbank && vbank && (
        <div className="w-full border border-border p-5 flex flex-col gap-3">
          <p className="text-xs text-ink-muted">{d.depositGuide}</p>
          <div className="flex flex-col gap-2">
            {[
              [d.depositBank, vbank.bankName],
              [d.depositAccount, vbank.accountNumber],
              [d.depositAmount, `${amount.toLocaleString()}원`],
              [d.depositDue, vbank.dueDate ? new Date(vbank.dueDate).toLocaleString('ko-KR') : ''],
            ].map(([label, value]) => value && (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-ink-muted">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink-muted border-t border-border pt-3">{d.depositNote}</p>
        </div>
      )}

      <Link
        href={`/${lang}/collections/new`}
        className="text-sm underline underline-offset-4 text-ink-muted hover:text-ink transition-colors mt-2"
      >
        {d.continueShopping}
      </Link>
    </section>
  )
}
