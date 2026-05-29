'use client'

import { useState, useTransition } from 'react'
import { submitAnswer } from '@/lib/actions/qa'
import type { AnswerTemplate, QuestionCategory } from '@/lib/supabase/types'

const categoryLabels: Record<string, string> = {
  shipping: '배송', return: '교환/반품', refund: '환불', product: '상품', other: '기타',
}

export default function AdminAnswerForm({
  questionId,
  templates,
  questionCategory,
}: {
  questionId: string
  templates: AnswerTemplate[]
  questionCategory: QuestionCategory
}) {
  const [content, setContent] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!content.trim()) return
    startTransition(async () => {
      await submitAnswer(questionId, content, 'ko')
    })
  }

  // 문의 카테고리와 일치하는 템플릿을 우선 노출, 나머지는 펼쳤을 때만 표시
  const relevant = templates.filter((t) => t.category === questionCategory)
  const others = templates.filter((t) => t.category !== questionCategory)
  const visible = showAll ? [...relevant, ...others] : relevant

  return (
    <div className="border border-border rounded-xl p-5">
      <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-ink-muted mb-4">답변 작성</p>

      {/* 템플릿 버튼 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-ink-muted">
            템플릿 불러오기
            {relevant.length > 0 && !showAll && (
              <span className="ml-1.5 text-ink-muted/70">· {categoryLabels[questionCategory]} 관련</span>
            )}
          </p>
          {others.length > 0 && (
            <button type="button" onClick={() => setShowAll((v) => !v)}
              className="text-[11px] text-ink-muted hover:text-ink transition-colors">
              {showAll ? '관련 템플릿만' : '전체 보기'}
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="text-[11px] text-ink-muted/70 py-1">
            이 카테고리의 템플릿이 없습니다. ‘전체 보기’를 눌러 다른 템플릿을 확인하세요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {visible.map((tmpl) => (
              <button key={tmpl.id} type="button"
                onClick={() => setContent(tmpl.content)}
                className="text-[11px] px-2.5 py-1 border border-border rounded-full hover:border-ink hover:bg-surface transition-colors">
                {showAll && (
                  <span className="text-ink-muted/70">{categoryLabels[tmpl.category] ?? tmpl.category} — </span>
                )}
                {tmpl.title}
              </button>
            ))}
          </div>
        )}
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
