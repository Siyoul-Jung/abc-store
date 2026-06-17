'use client'

import { useState } from 'react'
import Script from 'next/script'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/format'
import AddressSearchModal from './AddressSearchModal'
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
    name: string; phone: string; email: string; zipcode: string; address: string
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

type SavedAddress = {
  id: string
  name: string
  phone: string
  zipcode: string
  address: string
  addressDetail: string
  isDefault: boolean
}

type Props = {
  cart: Cart
  locale: Locale
  dict: Dict
  // 로그인 고객의 계정 이메일 + 저장된 배송지 목록 (게스트는 undefined).
  account?: {
    email: string
    addresses: SavedAddress[]
  }
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

export default function CheckoutForm({ cart, locale, dict, account }: Props) {
  const savedAddresses = account?.addresses ?? []
  const initialAddr = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]

  const [form, setForm] = useState({
    name: initialAddr?.name ?? '',
    phone: initialAddr?.phone ?? '',
    email: account?.email ?? '',
    zipcode: initialAddr?.zipcode ?? '',
    address: initialAddr?.address ?? '',
    addressDetail: initialAddr?.addressDetail ?? '',
    memo: '',
  })
  // 저장된 배송지가 있으면 카드(선택)로 시작, 없으면 직접 입력 폼
  const [addrMode, setAddrMode] = useState<'card' | 'picker' | 'form'>(savedAddresses.length ? 'card' : 'form')
  const [selectedId, setSelectedId] = useState<string | null>(initialAddr?.id ?? null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card')
  const [refundBank, setRefundBank] = useState('')
  const [refundAccountNum, setRefundAccountNum] = useState('')
  const [refundHolder, setRefundHolder] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [tossReady, setTossReady] = useState(false)
  const [error, setError] = useState('')
  const [isIsland, setIsIsland] = useState(false)
  const [addressSearchOpen, setAddressSearchOpen] = useState(false)
  // 다음 우편번호 스크립트 로드 상태 — 실패 시 주소 직접 입력으로 폴백 (결제 차단 방지)
  const [daumReady, setDaumReady] = useState(false)
  const [daumFailed, setDaumFailed] = useState(false)

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

  // 저장된 배송지 선택 → 폼 채우고 카드 모드로
  function selectAddress(a: SavedAddress) {
    setForm((prev) => ({
      ...prev,
      name: a.name, phone: a.phone, zipcode: a.zipcode,
      address: a.address, addressDetail: a.addressDetail,
    }))
    setSelectedId(a.id)
    setAddrMode('card')
  }

  // "새 배송지 입력" → 배송지 필드 비우고 직접 입력 폼으로 (이메일·메모는 유지)
  function enterNewAddress() {
    setForm((prev) => ({ ...prev, name: '', phone: '', zipcode: '', address: '', addressDetail: '' }))
    setSelectedId(null)
    setAddrMode('form')
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    // 우편번호 필수 + 5자리 숫자 — 제주/도서산간 추가배송비 감지와 택배 발송 모두 우편번호에 의존
    // 이메일 필수 — 주문확인·환불완료 알림의 유일한 발송 채널 (Shopify 주문에 저장됨)
    if (!form.name || !form.phone || !form.address || !/^\d{5}$/.test(form.zipcode) || !/^\S+@\S+\.\S+$/.test(form.email)) {
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
      {/* 다음(카카오) 우편번호 검색 — 무료, 키 불필요 */}
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
        onReady={() => setDaumReady(true)}
        onError={() => setDaumFailed(true)}
      />

      {addressSearchOpen && (
        <AddressSearchModal
          onSelect={(zipcode, address) => {
            setForm((prev) => ({ ...prev, zipcode, address }))
            setAddressSearchOpen(false)
          }}
          onClose={() => setAddressSearchOpen(false)}
        />
      )}

      <form onSubmit={handlePay} className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10">
        {/* Shipping form */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold break-keep">{locale === 'ja' ? '配送先' : '배송지'}</h2>

          <div className="flex flex-col gap-3">
            {/* 주문자 이메일 — 주문확인·환불완료 알림 발송 주소 */}
            <input
              className={inputCls}
              placeholder={d.email}
              value={form.email}
              onChange={update('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
            />

            {/* 배송지: 저장된 배송지가 있으면 카드+선택, 없으면 직접 입력 */}
            {addrMode === 'card' ? (
              <div className="border border-ink rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="text-sm leading-relaxed min-w-0">
                  <p className="font-medium">
                    {form.name}
                    {form.phone && <span className="text-ink-muted font-normal ml-2">{form.phone}</span>}
                  </p>
                  <p className="text-ink-muted break-keep">
                    {form.zipcode && `(${form.zipcode}) `}{form.address}
                  </p>
                  {form.addressDetail && <p className="text-ink-muted break-keep">{form.addressDetail}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setAddrMode('picker')}
                  className="shrink-0 text-xs border border-border rounded-full px-3 py-1 hover:bg-surface transition-colors"
                >
                  {locale === 'ja' ? '変更' : '변경'}
                </button>
              </div>
            ) : addrMode === 'picker' ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-wide text-ink-muted">
                  {locale === 'ja' ? '配送先を選択' : '배송지 선택'}
                </p>
                <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectAddress(a)}
                      className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-surface transition-colors ${selectedId === a.id ? 'bg-surface' : ''}`}
                    >
                      <span className="text-sm leading-relaxed min-w-0">
                        <span className="font-medium">{a.name}</span>
                        {a.phone && <span className="text-ink-muted ml-2">{a.phone}</span>}
                        <span className="block text-ink-muted break-keep">
                          {a.zipcode && `(${a.zipcode}) `}{a.address}{a.addressDetail ? ` ${a.addressDetail}` : ''}
                        </span>
                      </span>
                      {a.isDefault && (
                        <span className="shrink-0 text-[10px] font-semibold tracking-wider uppercase border border-ink rounded-full px-2 py-0.5">
                          {locale === 'ja' ? '基本' : '기본'}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={enterNewAddress}
                    className="w-full text-left px-4 py-3 text-sm text-ink-muted hover:bg-surface hover:text-ink transition-colors"
                  >
                    + {locale === 'ja' ? '新しい住所を入力' : '새 배송지 입력'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  className={inputCls}
                  placeholder={d.name}
                  value={form.name}
                  onChange={update('name')}
                  autoComplete="name"
                />
                <input
                  className={inputCls}
                  placeholder={d.phone}
                  value={form.phone}
                  onChange={update('phone')}
                  inputMode="tel"
                  autoComplete="tel"
                />
                <div className="flex gap-2 items-center">
                  <input
                    className={daumFailed ? `${inputCls} w-32` : `${inputCls} w-32 cursor-pointer bg-surface`}
                    placeholder={d.zipcode}
                    value={form.zipcode}
                    autoComplete="postal-code"
                    {...(daumFailed
                      ? { onChange: update('zipcode'), inputMode: 'numeric' as const }
                      : { readOnly: true, onClick: () => daumReady && setAddressSearchOpen(true) })}
                  />
                  <button
                    type="button"
                    onClick={() => daumReady && setAddressSearchOpen(true)}
                    disabled={daumFailed}
                    className="shrink-0 border border-ink text-ink text-sm px-4 py-2.5 hover:bg-ink hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink"
                  >
                    {locale === 'ja' ? '住所検索' : '주소 검색'}
                  </button>
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddrMode('picker')}
                      className="shrink-0 text-xs text-ink-muted underline underline-offset-2 hover:text-ink"
                    >
                      {locale === 'ja' ? '一覧' : '목록'}
                    </button>
                  )}
                </div>
                {daumFailed && (
                  <p className="text-xs text-coral break-keep">
                    {locale === 'ja'
                      ? '住所検索を読み込めませんでした。郵便番号と住所を直接入力してください。'
                      : '주소 검색을 불러오지 못했습니다. 우편번호와 주소를 직접 입력해 주세요.'}
                  </p>
                )}
                {/* 도로명주소 — 정상 시 주소 검색으로만 채워짐. 스크립트 실패 시 직접 입력 폴백 */}
                <input
                  className={daumFailed ? inputCls : `${inputCls} cursor-pointer bg-surface`}
                  placeholder={d.address}
                  value={form.address}
                  autoComplete="address-line1"
                  {...(daumFailed
                    ? { onChange: update('address') }
                    : { readOnly: true, onClick: () => daumReady && setAddressSearchOpen(true) })}
                />
                {/* 상세주소 — 동·호수 등 직접 입력 */}
                <input
                  className={inputCls}
                  placeholder={d.addressDetail}
                  value={form.addressDetail}
                  onChange={update('addressDetail')}
                  autoComplete="address-line2"
                />
              </>
            )}

            {/* 추가배송비 — 목적지 기준 (카드·입력 모드 공통) */}
            {isJeju ? (
              <p className="text-xs text-coral">
                {locale === 'ja'
                  ? `済州 追加配送料 +${JEJU_SURCHARGE.toLocaleString()}円`
                  : `제주 추가배송비 +${JEJU_SURCHARGE.toLocaleString()}원`}
              </p>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isIsland}
                  onChange={(e) => setIsIsland(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-ink-muted">
                  {locale === 'ja'
                    ? `離島・山間部 (+${ISLAND_SURCHARGE.toLocaleString()}円)`
                    : `도서·산간 지역 (+${ISLAND_SURCHARGE.toLocaleString()}원)`}
                </span>
              </label>
            )}

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
