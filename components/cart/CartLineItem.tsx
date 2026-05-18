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

export default function CartLineItem({ line, locale }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { merchandise } = line

  function handleQuantity(newQuantity: number) {
    startTransition(async () => {
      if (newQuantity === 0) {
        await removeCartLine(line.id, locale)
      } else {
        await updateCartLine(line.id, newQuantity, locale)
      }
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
        <p className="text-sm font-medium leading-snug">{merchandise.product.title}</p>
        {merchandise.title !== 'Default Title' && (
          <p className="text-xs text-ink-muted">{merchandise.title}</p>
        )}
        <p className="text-sm text-ink-muted">
          {formatPrice(merchandise.price.amount, merchandise.price.currencyCode, locale)}
        </p>

        <div className="flex items-center gap-3 mt-auto pt-2">
          <button
            onClick={() => handleQuantity(line.quantity - 1)}
            disabled={isPending}
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
