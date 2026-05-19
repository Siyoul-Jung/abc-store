'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { lookupOrder, submitReturnRequest } from '@/lib/actions/returns'
import type { OrderData } from '@/lib/actions/returns'
import type { Locale } from '@/lib/shopify/types'

const BRAND_FAULT_REASONS = new Set(['WRONG_ITEM', 'DEFECTIVE', 'NOT_AS_DESCRIBED'])

const KO_BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행',
  '기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고',
  'SC제일은행', '우체국', '기타',
]

const t = {
  ko: {
    title: '반품 신청',
    orderNumber: '주문번호',
    customerName: '주문자명',
    orderNumberPlaceholder: '숫자만 입력  예) 1001',
    customerNamePlaceholder: '주문 시 입력한 이름',
    lookup: '주문 조회',
    back: '← 다시 조회',
    selectItems: '반품할 상품',
    reason: '사유',
    reasonPlaceholder: '사유를 선택해 주세요',
    note: '상세 내용',
    notePlaceholder: '추가 내용을 입력해 주세요.',
    submit: '반품 신청하기',
    successTitle: '반품 신청이 완료되었습니다',
    successBody: '신청 내용을 검토 후 빠르게 안내드리겠습니다.',
    backToHome: '홈으로 돌아가기',
    exchangeNotice: '사이즈 교환을 원하시면 반품 후 환불 확인 시 원하시는 상품을 새로 주문해 주세요.',
    shippingCustomer: '반품 배송비는 고객 부담입니다.',
    shippingBrand: '불량 · 오배송의 경우 반품 배송비는 저희가 부담합니다.',
    refundAccountCheck: '가상계좌 · 무통장 입금으로 결제하셨나요?',
    refundAccount: '환불 계좌 정보',
    refundAccountNote: '환불받을 계좌를 입력해 주세요.',
    bank: '은행',
    bankPlaceholder: '은행 선택',
    accountNumber: '계좌번호',
    accountNumberPlaceholder: '- 없이 숫자만 입력',
    accountHolder: '예금주',
    accountHolderPlaceholder: '예금주명',
    errors: {
      ORDER_NOT_FOUND: '주문을 찾을 수 없습니다. 주문번호를 확인해 주세요.',
      NAME_MISMATCH: '주문자명이 일치하지 않습니다.',
      NOT_FULFILLED: '아직 출고 전인 주문입니다. 취소를 원하시면 고객센터로 문의해 주세요.',
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
    orderNumber: '注文番号',
    customerName: 'お名前',
    orderNumberPlaceholder: '数字のみ  例) 1001',
    customerNamePlaceholder: 'ご注文時のお名前',
    lookup: '注文を確認',
    back: '← 再検索',
    selectItems: '返品する商品',
    reason: '理由',
    reasonPlaceholder: '理由を選択してください',
    note: '詳細内容',
    notePlaceholder: '追加内容があれば入力してください。',
    submit: '返品を申請する',
    successTitle: '返品申請が完了しました',
    successBody: '内容を確認のうえ、速やかにご連絡いたします。',
    backToHome: 'ホームへ戻る',
    exchangeNotice: 'サイズ交換をご希望の場合は、返品・ご返金確認後に改めてご注文ください。',
    shippingCustomer: '返送料はお客様のご負担となります。',
    shippingBrand: '不良品・誤配送の場合、返送料は当店負担です。',
    refundAccountCheck: '銀行振込でお支払いでしたか？',
    refundAccount: '返金口座情報',
    refundAccountNote: '返金先の口座情報をご入力ください。',
    bank: '銀行名',
    bankPlaceholder: '銀行を入力',
    accountNumber: '口座番号',
    accountNumberPlaceholder: '数字のみ入力',
    accountHolder: '口座名義',
    accountHolderPlaceholder: '口座名義人',
    errors: {
      ORDER_NOT_FOUND: '注文が見つかりません。注文番号をご確認ください。',
      NAME_MISMATCH: 'お名前が一致しません。',
      NOT_FULFILLED: 'まだ発送前の注文です。キャンセルはお問い合わせください。',
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
}

const inputCls =
  'w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors'
const labelCls = 'text-xs font-semibold tracking-widest uppercase text-ink-muted'

export default function ReturnForm({ locale }: { locale: Locale }) {
  const l = t[locale]

  const [step, setStep] = useState<'lookup' | 'form' | 'success'>('lookup')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Step 1
  const [orderNum, setOrderNum] = useState('')
  const [custName, setCustName] = useState('')

  // Step 2
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [noteText, setNoteText] = useState('')
  const [successRef, setSuccessRef] = useState('')

  // 환불 계좌
  const [needsRefundAccount, setNeedsRefundAccount] = useState(false)
  const [refundBank, setRefundBank] = useState('')
  const [refundAccount, setRefundAccount] = useState('')
  const [refundHolder, setRefundHolder] = useState('')

  const isBrandFault = reason ? BRAND_FAULT_REASONS.has(reason) : null

  function handleLookup() {
    if (!orderNum.trim() || !custName.trim()) return
    setErrorKey(null)
    startTransition(async () => {
      const result = await lookupOrder(orderNum.trim(), custName.trim())
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

    const refundNote =
      refundBank && refundAccount && refundHolder
        ? `[환불계좌] ${refundBank} ${refundAccount} (${refundHolder})`
        : null

    startTransition(async () => {
      const result = await submitReturnRequest({
        orderId: orderData.id,
        type: 'return',
        items: selectedItems,
        reason,
        note: [noteText, refundNote].filter(Boolean).join(' / '),
      })
      if ('error' in result) { setErrorKey('GENERIC'); return }
      setSuccessRef(result.returnName)
      setStep('success')
    })
  }

  // ── Success ──────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <span className="text-3xl text-ink">✓</span>
        <h2 className="text-sm font-bold tracking-widest uppercase">{l.successTitle}</h2>
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

  // ── Step 1: Lookup ────────────────────────────────────────
  if (step === 'lookup') {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-sm font-bold tracking-widest uppercase">{l.title}</h1>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelCls}>{l.orderNumber}</label>
            <input
              className={inputCls}
              placeholder={l.orderNumberPlaceholder}
              value={orderNum}
              onChange={(e) => setOrderNum(e.target.value)}
              inputMode="numeric"
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls}>{l.customerName}</label>
            <input
              className={inputCls}
              placeholder={l.customerNamePlaceholder}
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            />
          </div>
          {errorKey && (
            <p className="text-sm text-coral">{l.errors[errorKey] ?? l.errors.GENERIC}</p>
          )}
          <button
            onClick={handleLookup}
            disabled={isPending || !orderNum.trim() || !custName.trim()}
            className="w-full py-4 text-sm font-medium tracking-widest uppercase bg-ink text-white hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {isPending ? '···' : l.lookup}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Form ──────────────────────────────────────────
  if (!orderData) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-widest uppercase">{l.title}</h1>
        <button
          onClick={() => { setStep('lookup'); setOrderData(null); setErrorKey(null) }}
          className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink transition-colors"
        >
          {l.back}
        </button>
      </div>

      <p className="text-xs text-ink-muted border-b border-border pb-4">
        {orderData.name} · {new Date(orderData.createdAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'ja-JP')}
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

      {/* 사유 + 배송비 안내 */}
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

      {/* 환불 계좌 */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={needsRefundAccount}
          onChange={(e) => setNeedsRefundAccount(e.target.checked)}
          className="w-4 h-4 accent-ink shrink-0"
        />
        <span className="text-sm text-ink">{l.refundAccountCheck}</span>
      </label>

      {needsRefundAccount && (
        <div className="flex flex-col gap-3 border border-border p-4">
          <div>
            <p className={labelCls}>{l.refundAccount}</p>
            <p className="text-xs text-ink-muted mt-1">{l.refundAccountNote}</p>
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
