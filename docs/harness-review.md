# Harness Engineering 검토 (abc-store)

> AI 코딩 에이전트가 안정적으로 작업하도록 프로젝트를 4가지 요소로 점검.
> 기준: Martin Fowler, "Harness engineering for coding agent users"
> https://martinfowler.com/articles/harness-engineering.html

## 4요소 진단

| 요소 | 역할 | abc-store 현황 |
|---|---|---|
| ① 지시 문서 | 에이전트에게 규칙 전달 | ✅ `AGENTS.md` + `CLAUDE.md` (명령어·금지규칙·구조) |
| ② 아키텍처 제약 | 잘못된 코드를 구조적으로 차단 | ✅ ESLint + TypeScript `strict` |
| ③ 피드백 루프 | 결과가 맞는지 즉시 확인 | 🔶 타입체크·빌드만 / **자동 테스트 없음** |
| ④ 지식 저장소 | 결정·맥락 축적 | ✅ `docs/decisions/` (ADR) + 체크리스트들 |

## ③ 피드백 루프 — 개선 로드맵

현재는 `npx tsc --noEmit`(타입) + `npm run build`(빌드)가 1차 안전망.
자동 테스트는 아직 없음. 우선순위순으로 추가 예정:

1. **결제·주문 로직** (`lib/actions/order.ts`) — 가장 중요. 금액 계산, 주문 생성 매핑
2. **배송비 계산** (`CheckoutForm.tsx`) — 제주/도서산간/무료배송 분기
3. **반품 환불 계산** (`lib/actions/refund.ts`) — 불량 전액 / 단순변심 차감

> 참고: 자매 프로젝트 tatlife에는 이미 Jest로 Stripe webhook 테스트가 구현돼 있음.
> abc-store는 상품 이전(Phase 2) 이후 코드가 안정화되면 동일 패턴으로 도입.

## 왜 지금 테스트를 안 넣었나 (의사결정)

- Phase 2에서 MakeShop → Shopify 상품 bulk 이전 시 코드가 변경될 예정.
- 변경 전 테스트를 짜면 재작성 비용이 큼.
- 현재는 타입 체크 + 수동 검증 + 빌드로 안전망을 유지하고, 결제 흐름 안정화 후 테스트 도입이 합리적.
