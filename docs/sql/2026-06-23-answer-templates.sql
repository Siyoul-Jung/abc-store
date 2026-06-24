-- CS 답변 템플릿 — answer_templates 테이블 생성
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- 적용 시점: 답변 템플릿 시드(scripts/seed-templates.mjs) 실행 전 필수.
--            테이블 없으면 시드/조회 시 오류. AdminAnswerForm의 '템플릿 불러오기'가 빈 상태가 됨.

-- 1) 테이블 — lib/supabase/types.ts 의 AnswerTemplate 타입과 일치
create table if not exists public.answer_templates (
  id         uuid primary key default gen_random_uuid(),
  category   text not null,          -- QUESTION_CATEGORIES 기준: shipping/return/defective/refund/product/other
  title      text not null,          -- 관리자 화면 템플릿 버튼 라벨
  content    text not null,          -- 클릭 시 답변창에 채워질 본문
  sort_order int  not null default 0, -- 노출 순서 (오름차순)
  created_at timestamptz not null default now()
);

-- 2) 카테고리별 정렬 조회 최적화 (AdminAnswerForm이 카테고리 일치 템플릿 우선 노출)
create index if not exists idx_answer_templates_category
  on public.answer_templates (category, sort_order);

-- 3) RLS: 다른 테이블과 동일하게 켜고 public 정책 없음
--    → 서버 액션(getAnswerTemplates)은 service_role(supabaseAdmin)로 접근하므로 RLS 우회.
alter table public.answer_templates enable row level security;

-- 실행 후: 로컬에서 `node scripts/seed-templates.mjs` 로 18종 템플릿 입력
-- 확인 쿼리 (선택)
-- select category, count(*) from public.answer_templates group by category order by category;
