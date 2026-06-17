'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { updateCartLine, removeCartLine } from '@/lib/actions/cart'
import { formatPrice } from '@/lib/utils/format'
import type { CartLine, Locale } from '@/lib/shopify/types'

type Props = {
  line: CartLine
  locale: Locale
}

const removeLabel: Record<Locale, string> = { ko: '삭제', ja: '削除', en: 'Remove' }

export default function CartLineItem({ line, locale }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { merchandise } = line

  // 수량 조절은 1에서 멈춘다 — 삭제는 전용 버튼으로만(− 로 조용히 사라지는 실수 방지).
  function handleQuantity(newQuantity: number) {
    if (newQuantity < 1) return
    startTransition(async () => {
      await updateCartLine(line.id, newQuantity, locale)
      window.dispatchEvent(new Event('cart:updated'))
      router.refresh()
    })
  }

  function handleRemove() {
    startTransition(async () => {
      await removeCartLine(line.id, locale)
      window.dispatchEvent(new Event('cart:updated'))
      router.refresh()
    })
  }

  return (
    <div className={`flex gap-4 py-5 border-b border-border transition-opacity ${isPending ? 'opacity-40' : ''}`}>
      <div className="relative w-20 h-24 flex-none bg-surface overflow-hidden">
        {merchandise.product.featuredImage && (
          <Image
            src={merchandise.product.featuredImage.url}
            alt={merchandise.product.featuredImage.altText ?? merchandise.product.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{merchandise.product.title}</p>
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="flex-none -mt-1 -mr-1 p-1 text-xs text-ink-muted hover:text-coral transition-colors disabled:opacity-30"
          >
            {removeLabel[locale]}
          </button>
        </div>
        {merchandise.title !== 'Default Title' && (
          <p className="text-xs text-ink-muted">{merchandise.title}</p>
        )}
        <p className="text-sm text-ink-muted">
          {formatPrice(merchandise.price.amount, merchandise.price.currencyCode, locale)}
        </p>

        <div className="flex items-center gap-3 mt-auto pt-2">
          <button
            onClick={() => handleQuantity(line.quantity - 1)}
            disabled={isPending || line.quantity <= 1}
            className="w-7 h-7 flex items-center justify-center border border-border text-sm hover:border-ink transition-colors disabled:opacity-30"
          >
            −
          </button>
          <span className="text-sm w-4 text-center tabular-nums">{line.quantity}</span>
          <button
            onClick={() => handleQuantity(line.quantity + 1)}
            disabled={isPending}
            className="w-7 h-7 flex items-center justify-center border border-border text-sm hover:border-ink transition-colors disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
