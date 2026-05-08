'use client'

import { useState, useTransition } from 'react'
import type { ProductVariant, Locale } from '@/lib/shopify/types'
import { addToCart } from '@/lib/actions/cart'

type Props = {
  variants: ProductVariant[]
  locale: Locale
  addToCartLabel: string
  soldOutLabel: string
}

export default function VariantSelector({ variants, locale, addToCartLabel, soldOutLabel }: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    variants.find((v) => v.availableForSale)?.id ?? variants[0]?.id ?? '',
  )
  const [added, setAdded] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selected = variants.find((v) => v.id === selectedId)
  const hasOptions = variants.some((v) => v.selectedOptions.some((o) => o.name !== 'Title'))

  function handleAddToCart() {
    if (!selected?.availableForSale || isPending) return
    startTransition(async () => {
      await addToCart(selected.id, locale)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {hasOptions && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-widest uppercase text-ink-muted">
            {selected?.selectedOptions[0]?.name}
          </span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                disabled={!v.availableForSale}
                className={`px-3 py-1.5 text-sm border transition-colors ${
                  v.id === selectedId
                    ? 'border-ink bg-ink text-white'
                    : v.availableForSale
                      ? 'border-border hover:border-ink'
                      : 'border-border text-ink-muted line-through cursor-not-allowed'
                }`}
              >
                {v.selectedOptions[0]?.value ?? v.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={!selected?.availableForSale || isPending}
        className={`w-full py-4 text-sm font-medium tracking-widest uppercase transition-colors ${
          !selected?.availableForSale
            ? 'bg-surface text-ink-muted cursor-not-allowed'
            : added
              ? 'bg-ink text-white'
              : 'bg-coral text-white hover:opacity-90'
        }`}
      >
        {isPending ? '···' : added ? '✓' : selected?.availableForSale ? addToCartLabel : soldOutLabel}
      </button>
    </div>
  )
}
