-- Q&A 연계 환불 요청 — refund_requests 테이블 생성
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- 적용 시점: 관리자 Q&A 환불 처리(AdminRefundPanel) 운영 전 필수.
--            ⚠️ questions 테이블이 먼저 존재해야 함 (아래 question_id 외래키 의존).
--            테이블 없으면:
--              - createRefundRequest(lib/actions/qa.ts:238) INSERT가 server_error
--              - getAdminQuestions(qa.ts:111)의 .select('*, refund_requests(*)') 임베디드 조인이 깨져
--                관리자 Q&A 목록에서 환불정보가 통째로 안 뜬다 (FK 필수 사유)

-- 1) 테이블 — lib/actions/qa.ts(createRefundRequest insert + updateRefundStatus) 기준
create table if not exists public.refund_requests (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid references public.questions(id) on delete cascade,  -- 임베디드 조인 FK (필수)
  customer_name   text,
  customer_email  text,                   -- 환불완료 메일 수신 주소
  order_number    text,
  refund_amount   int,
  payment_type    text not null default 'bank_transfer',  -- bank_transfer(무통장) / card 등
  bank_name       text,                   -- 무통장 환불 계좌 (서버에서 3필드 필수 검증, qa.ts:234)
  account_number  text,
  account_holder  text,
  admin_note      text,
  status          text not null default 'pending',  -- pending→processing→completed
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 2) 질문별 조회 최적화 (questions ↔ refund_requests 임베디드 조인)
create index if not exists idx_refund_requests_question
  on public.refund_requests (question_id);

-- 3) RLS: 다른 테이블과 동일하게 켜고 public 정책 없음
--    → 서버 액션은 service_role(supabaseAdmin)로 접근하므로 RLS 우회.
alter table public.refund_requests enable row level security;

-- 확인 쿼리 (선택)
-- select status, count(*) from public.refund_requests group by status;
