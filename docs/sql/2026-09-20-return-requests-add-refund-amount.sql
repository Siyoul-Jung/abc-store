-- return_requests.refund_amount 누락 보정 (스키마 드리프트 수정)
-- 실행 위치: Supabase 대시보드 > SQL Editor
--
-- 문제: 2026-06-23-return-requests.sql 에는 refund_amount 컬럼이 정의돼 있으나,
--       실제 운영 테이블은 그 이전 버전으로 생성돼 컬럼이 없음.
--       create table if not exists 라서 원본 DDL 재실행으로는 추가되지 않음 → ALTER 필요.
--
-- 영향(수정 전):
--   · /admin/returns/export CSV 다운로드 → 400 (column does not exist), 배송팀 전달 불가
--   · refund.ts processCardRefund/markRefundCompleted 의 refund_amount update 조용히 실패
--   · returns.ts updateReturnStatus('completed') 의 select 실패 → 환불완료 메일 미발송

alter table public.return_requests
  add column if not exists refund_amount int;   -- 환불 확정액(원). calcRefundAmount(refund.ts)로 산정

-- 확인
-- select column_name from information_schema.columns
--   where table_name = 'return_requests' and column_name = 'refund_amount';
