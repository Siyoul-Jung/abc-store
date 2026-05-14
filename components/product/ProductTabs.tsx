'use client'

import { useState } from 'react'

type Tab = { label: string; content: string; isHtml?: boolean }

type Props = { tabs: Tab[] }

export default function ProductTabs({ tabs }: Props) {
  const [active, setActive] = useState(0)

  const visibleTabs = tabs.filter((t) => t.content)
  if (visibleTabs.length === 0) return null

  return (
    <div className="mt-16 border-t border-border">
      <div className="flex border-b border-border">
        {visibleTabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`px-6 py-4 text-xs font-semibold tracking-widest uppercase transition-colors ${
              active === i
                ? 'border-b-2 border-ink text-ink'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-8">
        {visibleTabs[active].isHtml ? (
          <div
            className="prose max-w-none text-ink-muted"
            dangerouslySetInnerHTML={{ __html: visibleTabs[active].content }}
          />
        ) : (
          <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-line">
            {visibleTabs[active].content}
          </p>
        )}
      </div>
    </div>
  )
}
