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
  orderFailed?: boolean
  orderRef?: string
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
  items: string; subtotal: string; shippingFee: string; free: string; total: string; shippingAddr: string
  depositGuide: string; depositBank: string; depositAccount: string; depositAmount: string; depositDue: string
  depositNote: string
  continueShopping: string
  failTitle: string; failGuide: string; failRef: string; contactCs: string
}> = {
  ko: {
    titleCard: '주문이 완료되었습니다',
    titleVbank: '입금 계좌를 확인해 주세요',
    orderNum: '주문번호',
    items: '주문 상품',
    subtotal: '상품 합계',
    shippingFee: '배송비',
    free: '무료',
    total: '결제 금액',
    shippingAddr: '배송지',
    depositGuide: '아래 계좌로 입금하시면 주문이 확정됩니다.',
    depositBank: '은행',
    depositAccount: '계좌번호',
    depositAmount: '입금 금액',
    depositDue: '입금 기한',
    depositNote: '입금자명은 주문자명과 동일하게 입력해 주세요.',
    continueShopping: '쇼핑 계속하기',
    failTitle: '결제는 완료되었으나 주문 처리가 지연되고 있습니다',
    failGuide: '결제는 정상적으로 완료되었습니다. 다만 주문 생성에 일시적인 문제가 발생했습니다. 중복 결제되지 않으니 다시 결제하지 마시고, 아래 결제 참조번호와 함께 문의해 주시면 즉시 처리해 드리겠습니다.',
    failRef: '결제 참조번호',
    contactCs: '문의하기',
  },
  ja: {
    titleCard: 'ご注文が完了しました',
    titleVbank: '振込先口座をご確認ください',
    orderNum: '注文番号',
    items: 'ご注文商品',
    subtotal: '商品合計',
    shippingFee: '送料',
    free: '無料',
    total: 'お支払い金額',
    shippingAddr: 'お届け先',
    depositGuide: '下記の口座へお振込みいただくとご注文が確定します。',
    depositBank: '銀行名',
    depositAccount: '口座番号',
    depositAmount: 'お振込み金額',
    depositDue: '振込期限',
    depositNote: '振込名義はご注文者名と同じにしてください。',
    continueShopping: 'ショッピングを続ける',
    failTitle: 'お支払いは完了しましたが、注文処理が遅延しています',
    failGuide: 'お支払いは正常に完了しました。ただし注文の作成に一時的な問題が発生しました。二重決済はされませんので再度お支払いせず、下記の決済参照番号を添えてお問い合わせください。すぐに対応いたします。',
    failRef: '決済参照番号',
    contactCs: 'お問い合わせ',
  },
  en: {
    titleCard: 'Order Confirmed',
    titleVbank: 'Please complete your bank transfer',
    orderNum: 'Order',
    items: 'Items',
    subtotal: 'Subtotal',
    shippingFee: 'Shipping',
    free: 'Free',
    total: 'Total',
    shippingAddr: 'Ship to',
    depositGuide: 'Your order will be confirmed once we receive your payment.',
    depositBank: 'Bank',
    depositAccount: 'Account Number',
    depositAmount: 'Amount',
    depositDue: 'Due Date',
    depositNote: 'Please use your name as the transfer reference.',
    continueShopping: 'Continue Shopping',
    failTitle: 'Payment received, but order processing is delayed',
    failGuide: 'Your payment was completed successfully, but we had a temporary issue creating your order. You have not been charged twice — please do not pay again. Contact us with the reference number below and we will resolve it right away.',
    failRef: 'Payment Reference',
    contactCs: 'Contact Us',
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
  const { isVbank, vbank, shipping, items, amount, orderName, orderFailed, orderRef } = order!

  // 배송비는 별도 필드로 넘어오지 않으므로 총 결제액 − 상품합계로 역산한다.
  // 제주/도서산간 추가비도 자연히 배송비에 포함되어 총액과 항상 일치한다.
  const subtotal = items.reduce((sum, it) => sum + it.lineTotal, 0)
  const shippingFee = Math.max(0, amount - subtotal)

  // 결제는 됐으나 주문 생성이 실패한 경우 — 깨끗한 성공 화면 대신 지연 안내를 표시한다.
  // (관리자에겐 이미 알림 메일이 발송되어 수동 처리로 이어진다.)
  if (orderFailed) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16 sm:py-24 flex flex-col items-center gap-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-surface">⚠️</div>
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-base font-semibold break-keep">{d.failTitle}</h1>
          <p className="text-sm text-ink-muted break-keep leading-relaxed">{d.failGuide}</p>
          {orderRef && (
            <p className="text-sm">{d.failRef}: <span className="font-medium break-all">{orderRef}</span></p>
          )}
        </div>
        <Link
          href={`/${lang}/qa/new`}
          className="text-sm border border-ink px-5 py-2.5 hover:bg-ink hover:text-white transition-colors"
        >
          {d.contactCs}
        </Link>
      </section>
    )
  }

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
          <div className="border-t border-border bg-surface px-5 py-3 flex flex-col gap-2">
            <div className="flex justify-between text-sm text-ink-muted">
              <span>{d.subtotal}</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-sm text-ink-muted">
              <span>{d.shippingFee}</span>
              <span>{shippingFee > 0 ? `${shippingFee.toLocaleString()}원` : d.free}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-1">
              <span className="text-sm font-semibold">{d.total}</span>
              <span className="text-sm font-semibold">{amount.toLocaleString()}원</span>
            </div>
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
