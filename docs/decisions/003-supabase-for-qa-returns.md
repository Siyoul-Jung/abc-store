# 003 — Supabase를 Q&A·반품 저장소로

## 결정
Shopify가 다루지 않는 데이터(Q&A 게시판, 반품 신청, 환불 요청)는 **Supabase**에 저장한다.

## 배경
- Shopify에는 1:1 문의 게시판 같은 데이터 모델이 없다.
- 반품·환불은 Shopify 네이티브 반품과 별개로, 관리자가 상태를 단계별
  (pending → approved → received → completed)로 관리해야 한다.

## 대안
- **Shopify 메타필드에 욱여넣기**: 게시판·상태 워크플로우엔 부적합.
- **별도 백엔드 직접 구축**: 인증·DB·보안을 다 만들어야 해 비용이 큼.

## 이유
- Supabase로 DB(PostgreSQL) + 인증 + 행 수준 보안(RLS)을 빠르게 확보.
- 서버 액션에서 `supabaseAdmin`(service_role)로 검증 후 기록.
- 고객은 본인 데이터만, 관리자는 상태 관리 — RLS로 접근 분리.

## 트레이드오프
- 데이터가 Shopify와 Supabase 두 곳에 나뉜다.
- 반품은 Shopify `returnCreate` + Supabase `return_requests`를 함께 다뤄야 함
  (Shopify=반품 의사, Supabase=환불 처리 추적).
