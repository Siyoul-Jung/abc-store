'use client'

import { useState, useTransition } from 'react'
import { submitAnswer } from '@/lib/actions/qa'
import type { AnswerTemplate } from '@/lib/supabase/types'

export default function AdminAnswerForm({
  questionId,
  templates,
}: {
  questionId: string
  templates: AnswerTemplate[]
}) {
  const [content, setContent] = useState('')
  const [pending, startTransition] = useTransition()

  const handleTemplate = (templateContent: string) => {
    setContent(templateContent)
  }

  const handleSubmit = () => {
    if (!content.trim()) return
    startTransition(async () => {
      await submitAnswer(questionId, content, 'ko')
    })
  }

  // 카테고리별로 템플릿 그룹핑
  const templateGroups = templates.reduce<Record<string, AnswerTemplate[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    shipping: '배송', return: '교환/반품', refund: '환불', product: '상품', other: '기타',
  }

  return (
    <div className="border border-border rounded-xl p-5">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-4">답변 작성</p>

      {/* 템플릿 버튼 */}
      <div className="mb-4">
        <p className="text-xs text-ink-muted mb-2">템플릿 불러오기</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(templateGroups).map(([cat, tmps]) =>
            tmps.map((tmpl) => (
              <button key={tmpl.id} type="button"
                onClick={() => handleTemplate(tmpl.content)}
                className="text-[11px] px-2.5 py-1 border border-border rounded-full hover:border-ink hover:bg-surface transition-colors">
                {categoryLabels[cat] ?? cat} — {tmpl.title}
              </button>
            ))
          )}
        </div>
      </div>

      {/* 답변 텍스트 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        className="w-full border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-ink transition-colors resize-none mb-4"
        placeholder="답변 내용을 입력하세요..."
      />

      <button
        onClick={handleSubmit}
        disabled={pending || !content.trim()}
        className="w-full py-3 bg-ink text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
        {pending ? '저장 중...' : '답변 저장 + 고객 이메일 발송'}
      </button>
    </div>
  )
}
