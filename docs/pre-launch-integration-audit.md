# 런칭 전 헤드리스 ↔ Shopify 연결점 통합 감사

> 2026-09-09 실시. 헤드리스 구조(프론트=Next.js, 백엔드=Shopify API)에서 각 연결점이 유기적으로 맞물리는지 코드 레벨 정밀 감사.
> 5개 축: ①주문생성 파이프라인 ②재고·병행운영 ③Storefront 읽기 ④회원·반품·CAPI ⑤웹훅.

## 판정 요약

| # | 항목 | 판정 | 상태 |
|---|---|---|---|
| ① | **결제금액 서버검증 부재** | 🔴 런칭차단 | ✅ 수정완료 |
| ② | **결제 확정 시 재고 재검증 없음(오버셀)** | 🔴 런칭차단 | ✅ 수정완료 |
| ③ | 장바구니 서버액션 에러/userErrors 미검사 | 🟠 | ✅ 수정완료 |
| ④ | OIDC nonce·id_token 서명 미검증, refresh 없음 | 🟠 | ⏳ 미착수 |
| ⑤ | 병행운영 오버셀 = 운영정책만(코드강제 없음) | 🟠 | ⏳ 운영 |
| ⑥ | Meta 픽셀·event_id 부재(상단퍼널 추적/dedup) | 🟡 | ⏳ 결정필요 |
| ⑦ | formatPrice en 미분기·메타필드 이중fetch·캐싱 | 🟡 | ⏳ 경미 |

## ✅ 수정 완료 (브랜치 `fix/checkout-server-validation`)

### ① 결제금액 서버측 위변조 검증
- **문제**: 결제액(`total`)을 클라이언트 JS가 계산해 Toss로 전송, `confirm` 라우트가 승인금액을 카트 기준으로 재검증 안 함 → JS 변조로 임의 저가 결제 가능.
- **수정**: 배송비 계산을 `lib/utils/shipping.ts`로 단일화(클라이언트·서버 공유). `confirm` 라우트가 **결제 승인 전** 카트 원천(`cost.subtotalAmount`)+서버 배송비 규칙으로 기대금액 재계산 → 불일치 시 승인 안 하고 실패 처리. 주문 shipping_lines도 서버 검증값 사용.

### ② 결제 확정 시 재고 재검증(오버셀 차단)
- **문제**: 담은 뒤~결제 사이 품절돼도 재검증 없이 주문 생성. 카트 쿼리가 `quantityAvailable`를 안 가져와 초과수량 주문도 못 막음.
- **수정**: 카트 쿼리에 `availableForSale`·`quantityAvailable` 추가. `confirm`이 승인 전 각 라인 재고 검증 → 품절/재고부족 시 승인 안 하고 `/cart?notice=out_of_stock`로 반환(품절허용 상품은 통과). 카트 페이지 안내 추가.

### ③ 장바구니 서버액션 에러 방어
- **문제**: `cart.ts`가 `errors`/`userErrors` 미검사 → GraphQL 실패 시 500, 무효 cart_id면 조용히 안 담김.
- **수정**: 전 뮤테이션 errors/userErrors 검사, 무효 cart_id면 새 카트 자동 생성(복구), update/remove는 스테일 쿠키 정리.

## ⏳ 남은 항목

### ④ OIDC 세션 (🟠 — 보안 실피해는 제한적, 세션 UX가 실질)
- id_token **서명·nonce 미검증**(replay 방어 미완). 단 권한결정은 별도 `caQuery`로 재확인해 IDOR은 막힘([account.ts](../lib/actions/account.ts) 이중방어 ✅) → 실피해 제한적.
- **refresh_token 미처리** → `customer_token` 만료 시 조용히 로그아웃(재로그인 필요). 세션 지속성 UX 갭.
- 조치안: (a) nonce 저장·검증(작은 하드닝) (b) refresh 플로우 도입 — **세션 길이 정책 결정 필요**(런칭 필수 아님).

### ⑤ 병행운영 오버셀 (🟠 — 운영)
- 메이크샵↔Shopify 재고 싱크 코드 없음. `team-decisions.md`의 "상품 미겹침(A안)" 정책에만 의존.
- 조치: **"Shopify active 전환 = 메이크샵 내림" 체크리스트 강제화**(코드 아님). ②가 Shopify 내부 오버셀은 막지만, 두 몰 교차 오버셀은 정책으로만 방어.

### ⑥ Meta 픽셀·event_id (🟡 — 결정)
- 현재 **서버 CAPI 단독**(브라우저 픽셀 없음) → 실중복 없음. 대신 ViewContent·AddToCart 등 상단퍼널 추적 0.
- 결정: 브라우저 픽셀 도입할지. 도입 시 **event_id로 서버-픽셀 dedup 필수**.

### ⑦ 경미
- `formatPrice` en 로케일 미분기(en 노출 시 엔화 접미사) · 상품상세 메타필드 이중 fetch(프래그먼트값 재사용 가능) · 컬렉션/검색 캐싱 전략 미명시.

## ✅ 감사에서 정상 확인
결제상태 paid(카드·계좌이체 공통) · 멱등성(순차, `findOrderByTossId`) · 주문실패 관리자알림(RESEND/ADMIN_EMAIL env 필요) · 주문취소 IDOR 이중방어 · 반품 −7,000원 정책 · 배송지 필드명·zoneCode 필수 · 재고차감(`decrement_obeying_policy`) · Storefront locale @inContext · 웹훅 죽은코드 무해(fail-closed) · `.env.local` git 미추적
