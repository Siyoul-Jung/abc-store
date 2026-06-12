-- 비회원 Q&A 글쓰기 지원 — questions 테이블 스키마 변경
-- 실행 위치: Supabase 대시보드 > SQL Editor (주소창에 supabase.com/dashboard 직접 입력)
-- 적용 시점: 비회원 QA 코드 배포 전/후 무관하나, 배포 전 권장.

-- 1) customer_id 를 nullable 로 (비회원은 계정이 없으므로 null)
alter table public.questions
  alter column customer_id drop not null;

-- 2) 비회원 글 비밀번호 해시 컬럼 (scrypt 해시. 로그인 고객은 null)
alter table public.questions
  add column if not exists password_hash text;

-- 확인 쿼리 (선택)
-- select column_name, is_nullable, data_type
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'questions'
--    and column_name in ('customer_id', 'password_hash');
