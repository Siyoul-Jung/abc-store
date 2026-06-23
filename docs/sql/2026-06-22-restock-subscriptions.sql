-- 재입고 알림 신청 — restock_subscriptions 테이블 생성
-- 실행 위치: Supabase 대시보드 > SQL Editor (주소창에 supabase.com/dashboard 직접 입력)
-- 적용 시점: 재입고 알림 코드 배포 전 필수. 미생성 시 신청 시 server_error 반환.

-- 1) 테이블
create table if not exists public.restock_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  product_id    text not null,
  product_title text,
  variant_id    text not null,
  variant_title text,
  email         text not null,
  lang          text not null default 'ko',
  notified_at   timestamptz,           -- 재입고 안내 발송 시각 (null = 미발송 대기)
  created_at    timestamptz not null default now()
);

-- 2) 미발송 대기 건 빠른 조회 (운영자/자동화가 variant별 대기자 추출)
create index if not exists idx_restock_pending
  on public.restock_subscriptions (variant_id)
  where notified_at is null;

-- 3) 동일 (variant_id, email)의 중복 신청 방지 — 미발송 대기 건에 한해 유일
--    (재입고 후 또 품절되면 다시 신청 가능하도록 notified_at is null 조건부 유니크)
create unique index if not exists uniq_restock_pending
  on public.restock_subscriptions (variant_id, email)
  where notified_at is null;

-- 4) RLS: 다른 테이블과 동일하게 RLS 켜고 public 정책 없음
--    → 서버 액션은 service_role(supabaseAdmin)로 접근하므로 RLS를 우회함. 클라이언트 직접 접근은 차단.
alter table public.restock_subscriptions enable row level security;

-- 확인 쿼리 (선택)
-- select count(*) from public.restock_subscriptions where notified_at is null;
