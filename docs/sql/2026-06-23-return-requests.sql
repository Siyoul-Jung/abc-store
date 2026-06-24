-- 교환·반품 신청 — return_requests 테이블 생성
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- 적용 시점: /[lang]/returns 반품 신청 운영 전 필수.
--            테이블 없으면 submitReturnRequest(lib/actions/returns.ts:192) INSERT가 server_error로 실패 →
--            고객이 반품을 시도하는 순간 깨진다. (Shopify returnCreate는 성공해도 Supabase 기록은 누락)

-- 1) 테이블 — lib/actions/returns.ts(insert) + lib/actions/refund.ts(refund_amount update) 기준
create table if not exists public.return_requests (
  id                uuid primary key default gen_random_uuid(),
  lang              text,                   -- 환불완료 메일 언어 (ko/ja)
  order_id          text,                   -- Shopify order GID
  order_number      text not null,          -- 주문번호 (#1001 등) — CSV·메일 표시용
  customer_name     text,
  items_json        text,                   -- 반품 상품 라벨 (itemsLabel 문자열)
  reason            text,                   -- 반품 사유 코드 (DEFECTIVE/WRONG_ITEM/SIZE/... )
  note              text,
  bank_name         text,                   -- 무통장 환불 계좌 (카드 환불은 null)
  account_number    text,
  account_holder    text,
  shopify_return_id text,                   -- returnCreate가 반환한 Return GID
  refund_amount     int,                    -- 환불 확정액. 수령확인 시 calcRefundAmount로 산정(refund.ts)
  status            text not null default 'pending',  -- pending→approved→received→completed
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2) 관리자 목록 필터·정렬 최적화 (/admin/returns 는 status 필터 + 최신순)
create index if not exists idx_return_requests_status_created
  on public.return_requests (status, created_at desc);

-- 3) RLS: 다른 테이블과 동일하게 켜고 public 정책 없음
--    → 서버 액션은 service_role(supabaseAdmin)로 접근하므로 RLS 우회.
alter table public.return_requests enable row level security;

-- 확인 쿼리 (선택)
-- select status, count(*) from public.return_requests group by status;
