# 런칭 전 헤드리스 ↔ Shopify 연결점 통합 감사

> 2026-09-09 실시. 헤드리스 구조(프론트=Next.js, 백엔드=Shopify API)에서 각 연결점이 유기적으로 맞물리는지 코드 레벨 정밀 감사.
> 5개 축: ①주문생성 파이프라인 ②재고·병행운영 ③Storefront 읽기 ④회원·반품·CAPI ⑤웹훅.

## 판정 요약

| # | 항목 | 판정 | 상태 |
|---|---|---|---|
| ① | **결제금액 서버검증 부재** | 🔴 런칭차단 | ✅ 수정완료 |
| ② | **결제 확정 시 재고 재검증 없음(오버셀)** | 🔴 런칭차단 | ✅ 수정완료 |
| ③ | 장바구니 서버액션 에러/userErrors 미검사 | 🟠 | ✅ 수정완료 |
| ④ | OIDC nonce·id_token 서명 미검증, refresh 없음 | 🟠 | ✅ nonce 검증(PR#49) / ⏳ refresh 미착수 |
| ⑤ | 병행운영 오버셀 = 운영정책만(코드강제 없음) | 🟠 | ⏳ 운영 |
| ⑥ | Meta 픽셀·event_id 부재(상단퍼널 추적/dedup) | 🟡 | ✅ 브라우저 픽셀 도입(A) |
| ⑦ | formatPrice en 미분기·메타필드 이중fetch·캐싱 | 🟡 | ✅ 코드2건 수정 / 캐싱 문서화 |

## ✅ 수정 완료 (브랜치 `fix/checkout-server-validation`)

### ① 결제금액 서버측 위변조 검증
- **문제**: 결제액(`total`)을 클라이언트 JS가 계산해 Toss로 전송, `confirm` 라우트가 승인금액을 카트 기준으로 재검증 안 함 → JS 변조로 임의 저가 결제 가능.
- **수정**: 배송비 계산을 `lib/utils/shipping.ts`로 단일화(클라이언트·서버 공유). `confirm` 라우트가 **결제 승인 전** 카트 원천(`cost.subtotalAmount`)+서버 배송비 규칙으로 기대금액 재계산 → 불일치 시 승인 안 하고 실패 처리. 주문 shipping_lines도 서버 검증값 사용.

### ② 결제 확정 시 재고 재검증(오버셀 차단)
- **문제**: 담은 뒤~결제 사이 품절돼도 재검증 없이 주문 생성. 카트 쿼리가 `quantityAvailable`를 안 가져와 초과수량 주문도 못 막음.
- **수정**: 카트 쿼리에 `availableForSale` 추가. `confirm`이 승인 전 각 라인 `availableForSale` 검증 → 품절 시 승인 안 하고 `/cart?notice=out_of_stock`로 반환. 카트 페이지 안내 추가.
  - ⚠️ **정정(PR#50)**: 초기엔 `quantityAvailable`(수량 재검증)도 넣었으나, Storefront 토큰에 `unauthenticated_read_product_inventory` scope가 없어 `ACCESS_DENIED` → getCartCount throw → **프로덕션 layout 500** 유발. `quantityAvailable` 제거하고 `availableForSale`(scope 불필요)만 유지. 초과수량 재검증이 필요하면 스코프 확보 후 재도입.

### ③ 장바구니 서버액션 에러 방어
- **문제**: `cart.ts`가 `errors`/`userErrors` 미검사 → GraphQL 실패 시 500, 무효 cart_id면 조용히 안 담김.
- **수정**: 전 뮤테이션 errors/userErrors 검사, 무효 cart_id면 새 카트 자동 생성(복구), update/remove는 스테일 쿠키 정리.

## ⏳ 남은 항목

### ④ OIDC 세션 (🟠 — 보안 실피해는 제한적, 세션 UX가 실질)
- ✅ **nonce 검증 완료(PR#49)**: login에서 `_auth_nonce` 쿠키 저장 → callback에서 id_token의 nonce와 대조, 불일치 시 거부(fail-safe: 토큰에 nonce 없으면 통과+경고). replay 방어 확보.
- 권한결정은 별도 `caQuery`로 재확인해 IDOR은 막힘([account.ts](../lib/actions/account.ts) 이중방어 ✅) → 실피해 제한적.
- ⏳ **refresh_token 미처리(남음)** → `customer_token` 만료 시 조용히 로그아웃(재로그인 필요). 세션 지속성 UX 갭.
- 남은 조치: refresh 플로우 도입 — **세션 길이 정책 결정 필요**(런칭 필수 아님, 런칭 후).

### ⑤ 병행운영 오버셀 (🟠 — 운영)
- 메이크샵↔Shopify 재고 싱크 코드 없음. `team-decisions.md`의 "상품 미겹침(A안)" 정책에만 의존.
- 조치: **"Shopify active 전환 = 메이크샵 내림" 체크리스트 강제화**(코드 아님). ②가 Shopify 내부 오버셀은 막지만, 두 몰 교차 오버셀은 정책으로만 방어.

### ⑥ Meta 픽셀·event_id — ✅ 브라우저 픽셀 도입(A안, 브랜치 `fix/audit-minor-cleanup`)
- **도입 이유**: 서버 CAPI 단독이라 ViewContent·AddToCart 상단퍼널 신호 0 → 리타게팅 모수·전환최적화 학습 데이터 빈약. 마케팅 본격화 전 토대.
- **구현**:
  - 베이스 픽셀 `components/analytics/MetaPixel.tsx`([lang]/layout 마운트) — 초기 PageView는 인라인 스니펫, 이후 라우트 변경마다 useEffect. `NEXT_PUBLIC_META_PIXEL_ID` 필요.
  - `ProductViewTracker`(상품상세) → ViewContent · `VariantSelector`/`QuickAddButton` → AddToCart · `PurchaseTracker`(complete) → Purchase.
  - 클라이언트 발화는 `lib/analytics/pixel.ts`의 `trackPixel()`로 통일(픽셀 미로드 시 no-op).
  - **Purchase dedup**: confirm 라우트가 `event_id = purchase_{orderId}`를 CAPI(`meta-capi.ts`에 `eventId` 필드 추가)와 `order_confirmation` 쿠키(`pixelPurchase`)에 함께 실어, complete 페이지 브라우저 Purchase가 **동일 eventId**로 발화 → Meta가 `(event_name, event_id)`로 중복 제거. 가상계좌는 서버(웹훅) 단독이라 `pixelPurchase=null`(브라우저 미발화).
  - 부가효과: 픽셀이 심는 `_fbp`/`_fbc`를 confirm이 이미 읽으므로 기존 서버 CAPI 매칭 품질도 향상.
- **런칭 전 필요**: `NEXT_PUBLIC_META_PIXEL_ID`를 Vercel(Production/Preview/Development)에 등록(값=기존 `META_PIXEL_ID`, 공개값). 미등록 시 픽셀 미발화(서버 CAPI는 그대로 동작).
- **개인정보**: 한국은 픽셀 사전동의 의무 약함(비교적 관대). 일본 런칭 시 쿠키 동의 배너 검토 필요(team-decisions 2-6).

### ⑦ 경미 — ✅ 코드 2건 수정 / 캐싱은 문서화(브랜치 `fix/audit-minor-cleanup`)
- ✅ **`formatPrice` en 분기**: en일 때 '엔' 접미사 붙던 버그 수정. ko='원'·ja='엔' 접미, en은 `currencyCode` 기반 기호 접두(KRW→₩·JPY→¥·기타→코드). `currencyCode` 인자를 실제 활용.
- ✅ **메타필드 이중 fetch 제거**: 상세페이지가 `getProductById`(Storefront, PRODUCT_FRAGMENT) 값과 별도 `getProductMetafields`(Admin)를 둘 다 호출하던 중복 제거. 메타필드 정의가 **`storefront=PUBLIC_READ`**(Admin으로 확인)라 Storefront가 값을 정상 반환 → 프래그먼트 값(`product.careInstructions?.value`) 재사용, Admin 함수·import 삭제(storefront.ts에서 Admin 호출 제거 = 룰 준수 개선). QuickAddButton도 동일 프래그먼트 경로라 소스 일원화. (현재 값 미입력 상태 — Phase 2 상품이전 때 채워짐)
- 📋 **캐싱 전략**: 코드 변경 없음. Storefront는 `createStorefrontApiClient` 자체 fetch라 Next 데이터캐시 미경유 + 컬렉션(searchParams)·상세(noStore) 이미 동적 → **현재 "전부 동적 = 재고 정확도 우선"이 런칭 전 정답.** 캐싱(ISR/revalidate) 도입은 트래픽 증가로 API 비용·지연이 문제될 때의 **런칭 후 스케일링 최적화**로 보류(지금 넣으면 재고 stale 위험).

## ✅ 감사에서 정상 확인
결제상태 paid(카드·계좌이체 공통) · 멱등성(순차, `findOrderByTossId`) · 주문실패 관리자알림(RESEND/ADMIN_EMAIL env 필요) · 주문취소 IDOR 이중방어 · 반품 −7,000원 정책 · 배송지 필드명·zoneCode 필수 · 재고차감(`decrement_obeying_policy`) · Storefront locale @inContext · 웹훅 죽은코드 무해(fail-closed) · `.env.local` git 미추적
