'use client'

import { useState } from 'react'
import Script from 'next/script'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/format'
import type { Cart, Locale } from '@/lib/shopify/types'

const SHIPPING_THRESHOLD = 80000
const SHIPPING_FEE = 3500
const JEJU_SURCHARGE = 3000
const ISLAND_SURCHARGE = 4000

const KO_BANKS = [
  '국민은행', '신한은행', '우리은행', '하나은행', '농협은행',
  '기업은행', '카카오뱅크', '토스뱅크', '케이뱅크', '새마을금고',
  'SC제일은행', '우체국', '기타',
]

type Dict = {
  checkout: {
    name: string; phone: string; zipcode: string; address: string
    addressDetail: string; memo: string; memoPlaceholder: string
    orderSummary: string; shippingFee: string; freeShipping: string
    total: string; pay: string; required: string
    paymentMethod: string; card: string; bankTransfer: string
    refundAccount: string; refundAccountNote: string
    bank: string; bankPlaceholder: string
    accountNumber: string; accountNumberPlaceholder: string
    accountHolder: string; accountHolderPlaceholder: string
    requiredBankInfo: string
  }
}

type Props = {
  cart: Cart
  locale: Locale
  dict: Dict
}

declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      payment: (opts: { customerKey: string }) => {
        requestPayment: (opts: object) => Promise<void>
      }
    }
  }
}

export default function CheckoutForm({ cart, locale, dict }: Props) {
  const [form, setForm] = useState({
    name: '', phone: '', zipcode: '', address: '', addressDetail: '', memo: '',
  })
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card')
  const [refundBank, setRefundBank] = useState('')
  const [refundAccountNum, setRefundAccountNum] = useState('')
  const [refundHolder, setRefundHolder] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [tossReady, setTossReady] = useState(false)
  const [error, setError] = useState('')
  const [isIsland, setIsIsland] = useState(false)

  const { checkout: d } = dict
  const subtotal = Number(cart.cost.subtotalAmount.amount)
  const isJeju = form.zipcode.length === 5 && form.zipcode.startsWith('63')
  const surcharge = isJeju ? JEJU_SURCHARGE : isIsland ? ISLAND_SURCHARGE : 0
  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  const total = subtotal + shippingFee + surcharge

  const orderName =
    cart.lines.nodes[0]?.merchandise.product.title +
    (cart.lines.nodes.length > 1 ? ` 외 ${cart.lines.nodes.length - 1}건` : '')

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    // 우편번호 필수 + 5자리 숫자 — 제주/도서산간 추가배송비 감지와 택배 발송 모두 우편번호에 의존
    if (!form.name || !form.phone || !form.address || !/^\d{5}$/.test(form.zipcode)) {
      setError(d.required)
      return
    }
    if (paymentMethod === 'bank_transfer' && (!refundBank || !refundAccountNum || !refundHolder)) {
      setError(d.requiredBankInfo)
      return
    }
    if (!tossReady || isPaying) return
    setError('')
    setIsPaying(true)

    const orderId = `abc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    try {
      const cookiePayload = {
        ...form,
        paymentMethod,
        // 배송비 내역 — 주문 생성 시 shipping_lines로 분리 반영 (order.ts)
        shippingFee,
        surcharge,
        surchargeLabel: isJeju ? '제주 추가배송비' : isIsland ? '도서·산간 추가배송비' : '',
        ...(paymentMethod === 'bank_transfer' && {
          refundBank,
          refundAccountNum,
          refundHolder,
        }),
      }
      document.cookie = `checkout_shipping=${encodeURIComponent(JSON.stringify(cookiePayload))};path=/;max-age=600;samesite=lax`

      const tossPayments = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      const payment = tossPayments.payment({ customerKey: 'ANONYMOUS' })

      if (paymentMethod === 'card') {
        await payment.requestPayment({
          method: 'CARD',
          amount: { currency: 'KRW', value: total },
          orderId,
          orderName,
          successUrl: `${window.location.origin}/api/checkout/confirm?lang=${locale}`,
          failUrl: `${window.location.origin}/${locale}/checkout/fail`,
          customerName: form.name,
          customerMobilePhone: form.phone.replace(/-/g, ''),
        })
      } else {
        await payment.requestPayment({
          method: 'VIRTUAL_ACCOUNT',
          amount: { currency: 'KRW', value: total },
          orderId,
          orderName,
          successUrl: `${window.location.origin}/api/checkout/confirm?lang=${locale}`,
          failUrl: `${window.location.origin}/${locale}/checkout/fail`,
          customerName: form.name,
          customerMobilePhone: form.phone.replace(/-/g, ''),
        })
      }
    } catch {
      setIsPaying(false)
    }
  }

  const inputCls =
    'w-full border border-border px-3 py-2.5 text-sm outline-none focus:border-ink transition-colors'

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v2/standard"
        onLoad={() => setTossReady(true)}
      />

      <form onSubmit={handlePay} className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10">
        {/* Shipping form */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold break-keep">{locale === 'ja' ? '配送先' : '배송지'}</h2>

          <div className="flex flex-col gap-3">
            <input
              className={inputCls}
              placeholder={d.name}
              value={form.name}
              onChange={update('name')}
            />
            <input
              className={inputCls}
              placeholder={d.phone}
              value={form.phone}
              onChange={update('phone')}
              inputMode="tel"
            />
            <div className="flex gap-2 items-center">
              <input
                className={`${inputCls} w-32`}
                placeholder={d.zipcode}
                value={form.zipcode}
                onChange={update('zipcode')}
                inputMode="numeric"
              />
              {isJeju && (
                <span className="text-xs text-coral">제주 +{JEJU_SURCHARGE.toLocaleString()}원</span>
              )}
            </div>
            {!isJeju && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isIsland}
                  onChange={(e) => setIsIsland(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-ink-muted">도서·산간 지역 (+{ISLAND_SURCHARGE.toLocaleString()}원)</span>
              </label>
            )}
            <input
              className={inputCls}
              placeholder={d.address}
              value={form.address}
              onChange={update('address')}
            />
            <input
              className={inputCls}
              placeholder={d.addressDetail}
              value={form.addressDetail}
              onChange={update('addressDetail')}
            />
            <textarea
              className={`${inputCls} resize-none h-20`}
              placeholder={d.memoPlaceholder}
              value={form.memo}
              onChange={update('memo')}
            />
          </div>

          {/* 결제 수단 */}
          <div className="flex flex-col gap-3 pt-2">
            <h2 className="text-sm font-semibold break-keep">{d.paymentMethod}</h2>
            <div className="flex gap-2">
              {(['card', 'bank_transfer'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex-1 py-2.5 text-sm border transition-colors ${
                    paymentMethod === method
                      ? 'border-ink bg-ink text-white'
                      : 'border-border text-ink-muted hover:border-ink-muted'
                  }`}
                >
                  {method === 'card' ? d.card : d.bankTransfer}
                </button>
              ))}
            </div>

            {/* 무통장입금: 환불 계좌 */}
            {paymentMethod === 'bank_transfer' && (
              <div className="flex flex-col gap-3 border border-border p-4">
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted">
                    {d.refundAccount}
                  </p>
                  <p className="text-xs text-ink-muted mt-1">{d.refundAccountNote}</p>
                </div>
                <select
                  value={refundBank}
                  onChange={(e) => setRefundBank(e.target.value)}
                  className={`${inputCls} bg-white`}
                >
                  <option value="">{d.bankPlaceholder}</option>
                  {KO_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <input
                  className={inputCls}
                  placeholder={d.accountNumberPlaceholder}
                  inputMode="numeric"
                  value={refundAccountNum}
                  onChange={(e) => setRefundAccountNum(e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder={d.accountHolderPlaceholder}
                  value={refundHolder}
                  onChange={(e) => setRefundHolder(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Order summary + pay */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold break-keep">{d.orderSummary}</h2>

          <div className="flex flex-col gap-3">
            {cart.lines.nodes.map((line) => (
              <div key={line.id} className="flex gap-3 items-center">
                <div className="relative w-14 h-16 flex-none bg-surface overflow-hidden">
                  {line.merchandise.product.featuredImage && (
                    <Image
                      src={line.merchandise.product.featuredImage.url}
                      alt={line.merchandise.product.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug line-clamp-2">
                    {line.merchandise.product.title}
                  </p>
                  {line.merchandise.title !== 'Default Title' && (
                    <p className="text-xs text-ink-muted">{line.merchandise.title}</p>
                  )}
                  <p className="text-xs text-ink-muted">×{line.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>{d.shippingFee}</span>
              <span>
                {shippingFee === 0 ? d.freeShipping : formatPrice(String(SHIPPING_FEE), 'KRW', locale)}
              </span>
            </div>
            {surcharge > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>{isJeju ? '제주 추가배송비' : '도서·산간 추가배송비'}</span>
                <span>+{formatPrice(String(surcharge), 'KRW', locale)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>{d.total}</span>
              <span>{formatPrice(String(total), 'KRW', locale)}</span>
            </div>
          </div>

          {error && <p className="text-xs text-coral">{error}</p>}

          <button
            type="submit"
            disabled={isPaying || !tossReady}
            className="w-full bg-coral text-white text-sm font-medium tracking-widest uppercase py-4 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isPaying ? '···' : d.pay}
          </button>

          <p className="text-[11px] text-ink-muted leading-relaxed">
            결제 버튼 클릭 시{' '}
            <a href={`/${locale}/terms`} target="_blank" className="underline underline-offset-2 hover:text-ink">
              이용약관
            </a>
            ,{' '}
            <a href={`/${locale}/privacy`} target="_blank" className="underline underline-offset-2 hover:text-ink">
              개인정보처리방침
            </a>
            에 동의하며, 주문 내용을 확인하였습니다.
          </p>
        </div>
      </form>
    </>
  )
}
