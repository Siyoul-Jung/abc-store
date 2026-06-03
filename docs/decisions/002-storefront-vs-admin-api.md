# 002 — Storefront API vs Admin API 분리

## 결정
용도에 따라 두 Shopify API를 나눠 쓴다.
- **Storefront API** (공개 토큰): 상품 조회, 장바구니
- **Admin API** (`shpat_` 토큰, 서버 전용): 주문 생성·조회, 반품, 메타필드

## 배경
- 상품 조회·장바구니는 자주, 그리고 클라이언트 가까이서 일어난다.
- 주문 생성은 돈과 직결되고 관리자 권한이 필요하다.
- 두 API는 권한 범위와 호출 제한(rate limit)이 다르다.

## 대안
- **Admin API로 전부 처리**: 공개 노출 위험 + 낮은 rate limit으로 제외.
- **Storefront API로 전부 처리**: 주문 생성 등 관리 작업을 못 함.

## 이유
- 빈번한 조회는 rate limit이 높은 Storefront로 → 성능·안정성.
- 민감한 주문 작업은 서버 전용 Admin 토큰으로 → 보안·접근 제어.
- `lib/shopify/admin.ts`의 `adminGql()`로 Admin 호출을 한 군데로 모아 관리.

## 트레이드오프
- 두 클라이언트를 함께 유지해야 함.
- 어떤 작업에 어느 API를 쓸지 규칙을 지켜야 함 (→ AGENTS.md에 명시).
