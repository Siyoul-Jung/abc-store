'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { lookupOrder, submitReturnRequest } from '@/lib/actions/returns'
import type { OrderData } from '@/lib/actions/returns'
import type { Locale } from '@/lib/shopify/types'

export type CustomerOrder = {
  id: string
  name: string
  processedAt: string
  displayFulfillmentStatus?: string
  lineItems: { edges: { node: { title: string } }[] }
}

const BRAND_FAULT_REASONS = new Set(['WRONG_ITEM', 'DEFECTIVE', 'NOT_AS_DESCRIBED'])

const KO_BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행',
  '기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고',
  'SC제일은행', '우체국', '기타',
]

const t = {
  ko: {
    title: '반품 신청',
    selectOrderHint: '출고 완료된 주문만 표시됩니다',
    noOrders: '반품 가능한 주문이 없습니다.',
    noOrdersHint: '출고된 주문이 없거나 이미 반품 신청된 주문입니다.',
    refundPolicy: '환불 정책 보기 →',
    back: '← 주문 선택으로',
    selectItems: '반품할 상품',
    reason: '사유',
    reasonPlaceholder: '사유를 선택해 주세요',
    note: '상세 내용',
    notePlaceholder: '추가 내용을 입력해 주세요.',
    submit: '반품 신청하기',
    successTitle: '반품 신청이 완료되었습니다',
    successBody: '신청 내용을 검토 후 빠르게 안내드리겠습니다.',
    backToHome: '홈으로 돌아가기',
    shippingCustomer: '반품 배송비는 고객 부담입니다.',
    shippingBrand: '불량 · 오배송의 경우 반품 배송비는 저희가 부담합니다.',
    paymentCard: '카드 결제로 확인되었습니다.',
    paymentCardNote: '반품 신청 승인 후 카드로 자동 환불 처리됩니다.',
    paymentBank: '무통장입금으로 결제된 주문입니다.',
    refundAccount: '환불 계좌 정보',
    refundAccountNote: '환불받을 계좌를 입력해 주세요.',
    bank: '은행',
    bankPlaceholder: '은행 선택',
    accountNumber: '계좌번호',
    accountNumberPlaceholder: '- 없이 숫자만 입력',
    accountHolder: '예금주',
    accountHolderPlaceholder: '예금주명',
    errors: {
      ORDER_NOT_FOUND: '주문을 찾을 수 없습니다.',
      NOT_FULFILLED: '아직 출고 전인 주문입니다.',
      RETURN_EXISTS: '이미 반품 신청이 접수된 주문입니다.',
      NO_ITEMS: '반품할 상품을 선택해 주세요.',
      NO_REASON: '사유를 선택해 주세요.',
      GENERIC: '오류가 발생했습니다. 다시 시도해 주세요.',
    } as Record<string, string>,
    reasons: [
      { value: 'SIZE_TOO_SMALL', label: '사이즈가 작아요' },
      { value: 'SIZE_TOO_LARGE', label: '사이즈가 커요' },
      { value: 'WRONG_ITEM', label: '다른 상품이 도착했어요' },
      { value: 'DEFECTIVE', label: '불량 · 파손' },
      { value: 'NOT_AS_DESCRIBED', label: '상품 설명과 달라요' },
      { value: 'UNWANTED', label: '단순 변심' },
      { value: 'OTHER', label: '기타' },
    ],
  },
  ja: {
    title: '返品申請',
    selectOrderHint: '発送済みの注文のみ表示されます',
    noOrders: '返品可能なご注文がありません。',
    noOrdersHint: '発送済みのご注文がないか、すでに返品申請済みです。',
    refundPolicy: '返金ポリシーを見る →',
    back: '← 注文選択に戻る',
    selectItems: '返品する商品',
    reason: '理由',
    reasonPlaceholder: '理由を選択してください',
    note: '詳細内容',
    notePlaceholder: '追加内容があれば入力してください。',
    submit: '返品を申請する',
    successTitle: '返品申請が完了しました',
    successBody: '内容を確認のうえ、速やかにご連絡いたします。',
    backToHome: 'ホームへ戻る',
    shippingCustomer: '返送料はお客様のご負担となります。',
    shippingBrand: '不良品・誤配送の場合、返送料は当店負担です。',
    paymentCard: 'クレジットカード決済が確認されました。',
    paymentCardNote: '返品申請承認後、カードへ自動返金されます。',
    paymentBank: '銀行振込でのお支払いが確認されました。',
    refundAccount: '返金口座情報',
    refundAccountNote: '返金先の口座情報をご入力ください。',
    bank: '銀行名',
    bankPlaceholder: '銀行を入力',
    accountNumber: '口座番号',
    accountNumberPlaceholder: '数字のみ入力',
    accountHolder: '口座名義',
    accountHolderPlaceholder: '口座名義人',
    errors: {
      ORDER_NOT_FOUND: '注文が見つかりません。',
      NOT_FULFILLED: 'まだ発送前の注文です。',
      RETURN_EXISTS: 'すでに返品申請が受付済みです。',
      NO_ITEMS: '返品する商品を選択してください。',
      NO_REASON: '理由を選択してください。',
      GENERIC: 'エラーが発生しました。再度お試しください。',
    } as Record<string, string>,
    reasons: [
      { value: 'SIZE_TOO_SMALL', label: 'サイズが小さい' },
      { value: 'SIZE_TOO_LARGE', label: 'サイズが大きい' },
      { value: 'WRONG_ITEM', label: '違う商品が届いた' },
      { value: 'DEFECTIVE', label: '不良・破損' },
      { value: 'NOT_AS_DESCRIBED', label: '商品説明と異なる' },
      { value: 'UNWANTED', label: '単純返品' },
      { value: 'OTHER', label: 'その他' },
    ],
  },
  en: {
    title: 'Return Request',
    selectOrderHint: 'Only fulfilled orders are shown',
    noOrders: 'No returnable orders found.',
    noOrdersHint: 'No fulfilled orders, or returns have already been requested.',
    refundPolicy: 'View Refund Policy →',
    back: '← Back to Order Selection',
    selectItems: 'Items to Return',
    reason: 'Reason',
    reasonPlaceholder: 'Select a reason',
    note: 'Additional Details',
    notePlaceholder: 'Please enter any additional information.',
    submit: 'Submit Return Request',
    successTitle: 'Your return request has been submitted',
    successBody: 'We will review your request and get back to you shortly.',
    backToHome: 'Back to Home',
    shippingCustomer: 'Return shipping costs are the responsibility of the customer.',
    shippingBrand: 'In cases of defects or mis-shipment, we will cover the return shipping cost.',
    paymentCard: 'Card payment confirmed.',
    paymentCardNote: 'Your refund will be processed automatically to your card once the return is approved.',
    paymentBank: 'Bank transfer payment confirmed.',
    refundAccount: 'Refund Account Information',
    refundAccountNote: 'Please enter the bank account you would like your refund sent to.',
    bank: 'Bank',
    bankPlaceholder: 'Enter bank name',
    accountNumber: 'Account Number',
    accountNumberPlaceholder: 'Numbers only',
    accountHolder: 'Account Holder',
    accountHolderPlaceholder: 'Account holder name',
    errors: {
      ORDER_NOT_FOUND: 'Order not found.',
      NOT_FULFILLED: 'This order has not shipped yet.',
      RETURN_EXISTS: 'A return has already been requested for this order.',
      NO_ITEMS: 'Please select at least one item to return.',
      NO_REASON: 'Please select a reason.',
      GENERIC: 'An error occurred. Please try again.',
    } as Record<string, string>,
    reasons: [
      { value: 'SIZE_TOO_SMALL', label: 'Size too small' },
      { value: 'SIZE_TOO_LARGE', label: 'Size too large' },
      { value: 'WRONG_ITEM', label: 'Wrong item received' },
      { value: 'DEFECTIVE', label: 'Defective or damaged' },
      { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
      { value: 'UNWANTED', label: 'Change of mind' },
      { value: 'OTHER', label: 'Other' },
    ],
  },
}

const inputCls =
  'w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors'
const labelCls = 'text-xs font-semibold tracking-widest uppercase text-ink-muted'

type Props = {
  locale: Locale
  orders: CustomerOrder[]
  customerName: string
}

export default function ReturnForm({ locale, orders, customerName }: Props) {
  const l = t[locale]
  const dateLocale = locale === 'ko' ? 'ko-KR' : locale === 'ja' ? 'ja-JP' : 'en-US'

  const [step, setStep] = useState<'select' | 'form' | 'success'>('select')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [noteText, setNoteText] = useState('')

  const [refundBank, setRefundBank] = useState('')
  const [refundAccount, setRefundAccount] = useState('')
  const [refundHolder, setRefundHolder] = useState('')

  const isBrandFault = reason ? BRAND_FAULT_REASONS.has(reason) : null

  function handleOrderSelect(order: CustomerOrder) {
    setErrorKey(null)
    startTransition(async () => {
      const result = await lookupOrder(order.name, customerName, true)
      if ('error' in result) { setErrorKey(result.error); return }
      if (!result.order.isFulfilled) { setErrorKey('NOT_FULFILLED'); return }
      const initQty: Record<string, number> = {}
      result.order.lineItems.forEach((item) => { initQty[item.lineItemId] = 0 })
      setQuantities(initQty)
      setOrderData(result.order)
      setStep('form')
    })
  }

  function toggleItem(id: string) {
    setQuantities((prev) => ({ ...prev, [id]: prev[id] > 0 ? 0 : 1 }))
  }

  function changeQty(id: string, delta: number, max: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, Math.min((prev[id] ?? 0) + delta, max)),
    }))
  }

  function handleSubmit() {
    if (!orderData) return
    const selectedItems = orderData.lineItems
      .filter((item) => quantities[item.lineItemId] > 0 && item.fulfillmentLineItemId)
      .map((item) => ({
        fulfillmentLineItemId: item.fulfillmentLineItemId!,
        quantity: quantities[item.lineItemId],
      }))
    if (selectedItems.length === 0) { setErrorKey('NO_ITEMS'); return }
    if (!reason) { setErrorKey('NO_REASON'); return }
    setErrorKey(null)

    const itemsLabel = orderData.lineItems
      .filter((item) => quantities[item.lineItemId] > 0)
      .map((item) => `${item.name} ×${quantities[item.lineItemId]}`)
      .join(', ')

    startTransition(async () => {
      const result = await submitReturnRequest({
        orderId: orderData.id,
        orderName: orderData.name,
        customerName,
        lang: locale,
        items: selectedItems,
        itemsLabel,
        reason,
        note: noteText,
        bankName: refundBank || undefined,
        accountNumber: refundAccount || undefined,
        accountHolder: refundHolder || undefined,
      })
      if ('error' in result) { setErrorKey('GENERIC'); return }
      setStep('success')
    })
  }

  // ── Success ──────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-3xl text-ink">✓</span>
        <h2 className="text-sm font-bold tracking-widest uppercase break-keep">{l.successTitle}</h2>
        <p className="text-sm text-ink-muted">{l.successBody}</p>
        <Link
          href={`/${locale}`}
          className="mt-2 text-xs text-ink-muted underline underline-offset-4 hover:text-ink transition-colors"
        >
          {l.backToHome}
        </Link>
      </div>
    )
  }

  // ── Step select: 주문 선택 ────────────────────────────────
  if (step === 'select') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-sm font-bold tracking-widest uppercase break-keep">{l.title}</h1>
          <p className="text-xs text-ink-muted mt-1">{l.selectOrderHint}</p>
        </div>

        {orders.length === 0 ? (
          <div className="border border-border p-6 flex flex-col gap-2">
            <p className="text-sm font-medium">{l.noOrders}</p>
            <p className="text-xs text-ink-muted">{l.noOrdersHint}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => {
              const items = order.lineItems.edges.slice(0, 2).map(e => e.node.title)
              return (
                <button
                  key={order.id}
                  onClick={() => handleOrderSelect(order)}
                  disabled={isPending}
                  className="w-full border border-border p-4 text-left hover:border-ink transition-colors disabled:opacity-40"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold">{order.name}</span>
                    <span className="text-xs text-ink-muted">
                      {new Date(order.processedAt).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted truncate">{items.join(', ')}</p>
                </button>
              )
            })}
          </div>
        )}

        {errorKey && (
          <p className="text-sm text-coral">{l.errors[errorKey] ?? l.errors.GENERIC}</p>
        )}

        <Link
          href={`/${locale}/refund`}
          className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink transition-colors self-start"
        >
          {l.refundPolicy}
        </Link>
      </div>
    )
  }

  // ── Step form ─────────────────────────────────────────────
  if (!orderData) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-widest uppercase break-keep">{l.title}</h1>
        <button
          onClick={() => { setStep('select'); setOrderData(null); setErrorKey(null) }}
          className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink transition-colors"
        >
          {l.back}
        </button>
      </div>

      <p className="text-xs text-ink-muted border-b border-border pb-4">
        {orderData.name} · {new Date(orderData.createdAt).toLocaleDateString(dateLocale)}
      </p>

      {/* 상품 선택 */}
      <div className="flex flex-col gap-2">
        <p className={labelCls}>{l.selectItems}</p>
        <div className="border-t border-border">
          {orderData.lineItems.map((item) => {
            const checked = quantities[item.lineItemId] > 0
            return (
              <div key={item.lineItemId} className="flex items-center gap-3 py-3 border-b border-border">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(item.lineItemId)}
                  className="w-4 h-4 accent-ink shrink-0"
                />
                {item.image && (
                  <div className="relative w-10 h-[52px] shrink-0 overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
                  </div>
                )}
                <p className="flex-1 text-sm leading-snug">{item.name}</p>
                {checked && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => changeQty(item.lineItemId, -1, item.quantity)}
                      className="w-7 h-7 border border-border text-sm flex items-center justify-center hover:border-ink transition-colors">−</button>
                    <span className="w-6 text-center text-sm">{quantities[item.lineItemId]}</span>
                    <button type="button" onClick={() => changeQty(item.lineItemId, 1, item.quantity)}
                      className="w-7 h-7 border border-border text-sm flex items-center justify-center hover:border-ink transition-colors">+</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 사유 */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>{l.reason}</label>
        <select value={reason} onChange={(e) => setReason(e.target.value)}
          className={`${inputCls} bg-white`}>
          <option value="">{l.reasonPlaceholder}</option>
          {l.reasons.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {reason && (
          <p className={`text-xs px-3 py-2 ${isBrandFault ? 'bg-citrus/30 text-ink' : 'bg-surface text-ink-muted'}`}>
            {isBrandFault ? l.shippingBrand : l.shippingCustomer}
          </p>
        )}
      </div>

      {/* 상세 내용 */}
      <div className="flex flex-col gap-2">
        <label className={labelCls}>{l.note}</label>
        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
          placeholder={l.notePlaceholder}
          className={`${inputCls} resize-none h-24`} />
      </div>

      {/* 결제 수단별 환불 안내 */}
      {orderData.paymentMethod === 'card' ? (
        <div className="flex flex-col gap-1 border border-border px-4 py-3 bg-surface">
          <p className="text-xs font-semibold text-ink">{l.paymentCard}</p>
          <p className="text-xs text-ink-muted">{l.paymentCardNote}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border border-border p-4">
          <div>
            <p className={labelCls}>{l.refundAccount}</p>
            <p className="text-xs text-ink-muted mt-1">{l.paymentBank} {l.refundAccountNote}</p>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>{l.bank}</label>
            {locale === 'ko' ? (
              <select value={refundBank} onChange={(e) => setRefundBank(e.target.value)}
                className={`${inputCls} bg-white`}>
                <option value="">{l.bankPlaceholder}</option>
                {KO_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : (
              <input className={inputCls} placeholder={l.bankPlaceholder}
                value={refundBank} onChange={(e) => setRefundBank(e.target.value)} />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>{l.accountNumber}</label>
            <input className={inputCls} placeholder={l.accountNumberPlaceholder}
              inputMode="numeric" value={refundAccount}
              onChange={(e) => setRefundAccount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>{l.accountHolder}</label>
            <input className={inputCls} placeholder={l.accountHolderPlaceholder}
              value={refundHolder} onChange={(e) => setRefundHolder(e.target.value)} />
          </div>
        </div>
      )}

      {errorKey && (
        <p className="text-sm text-coral">{l.errors[errorKey] ?? l.errors.GENERIC}</p>
      )}

      <button onClick={handleSubmit} disabled={isPending}
        className="w-full py-4 text-sm font-medium tracking-widest uppercase bg-ink text-white hover:opacity-80 transition-opacity disabled:opacity-40">
        {isPending ? '···' : l.submit}
      </button>
    </div>
  )
}
