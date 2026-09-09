# 토스 결제 전환: 가상계좌 → 계좌이체(퀵) 마이그레이션 지도

> **배경**: Shopify 가맹점은 토스 **가상계좌 제공 불가**. 선택 가능 = 퀵계좌이체·국내카드·국내간편결제·해외카드(KRW). 무통장 수단을 **가상계좌 → 계좌이체(실시간)**로 교체해야 함.
> **MID**: `vabcsty4go` (독립몰 기준, 계약완료 2026-08-31). 카드 9개사 전부 승인, 계좌이체 활성(에스크로 사용).
> **상태(2026-09-08)**: 4문항 **Toss 개발자문서로 확정**(아래). **구현 착수 가능** — 실키 교체·테스트만 남음.

---

## 핵심 개념
**계좌이체(퀵)는 카드처럼 "결제 순간 실시간 완료"** — 가상계좌의 "계좌번호 발급 → 입금 대기 → 웹훅 확인" 시간차가 **없음**. 따라서 코드상 계좌이체는 **가상계좌보다 카드에 가까움**. 전환 = 가상계좌 특수처리(pending·웹훅·환불계좌)를 걷어내고 **카드 흐름에 합류**시키는 것.

## ✅ 4문항 확정 (Toss 개발자문서, 2026-09-08)
1. **메서드명**: `method: 'TRANSFER'` ✅ (계좌이체=퀵계좌이체)
2. **환불 방식**: **원계좌 자동 환불** ✅ — "출금됐던 원래 계좌로 환불". `refundReceiveAccount` **불필요** → 환불계좌 수집 UI 제거.
3. **에스크로**: 에스크로 사용 상점은 `requestPayment`에 **`escrowProducts` 배열 필요** — 각 상품 `{id, name, code, unitPrice, quantity}`. (카드=에스크로 미사용이라 불필요, 계좌이체 분기에만 추가)
   - ⚠️ **미확정(테스트로 검증)**: `escrowProducts`의 `unitPrice×quantity` 합=상품소계인데 결제 `amount`=소계+배송비. **에스크로 상품합≠결제액일 때 토스 처리방식**(배송비를 상품으로 넣어야 하나)이 문서 불명 → **테스트 키 실결제로 확인** 필요.
4. **웹훅**: 계좌이체 실시간 완료 → **입금 웹훅 없음** ✅. 승인(confirm) 시점 즉시 완료 처리.
> 근거: docs.tosspayments.com — 계좌이체 총정리 / 결제창 SDK / 퀵계좌이체 연동

---

## 변경 지도 (파일별)

### ① `components/checkout/CheckoutForm.tsx` — 🟡 중
- **L195**: `method: 'VIRTUAL_ACCOUNT'` → `method: 'TRANSFER'`
- **환불계좌 UI 제거**(L435–466) + 검증 제거(L149) + 쿠키 payload의 refund* 제거(L171–175)
  - 근거: 계좌이체는 환불 시 원계좌 자동 역이체 → 환불계좌 불필요 (질문 2 확정 후)
- 결제수단 라벨(`d.bankTransfer`)이 "계좌이체"로 표기되는지 확인 (dictionaries ko/ja)

### ② `lib/actions/order.ts` — 🔴 **핵심 함정**
- **L101**: `financial_status: isBankTransfer ? 'pending' : 'paid'`
- **L118**: `transactions: isBankTransfer ? [] : [ sale ]`
- **함정**: 지금 `bank_transfer`(=가상계좌)는 **pending**(입금 대기, 웹훅이 나중에 paid 전환). 계좌이체는 즉시 완료인데 이 로직이면 **주문이 영원히 pending에 묶임**(돈 받았는데 미결제 상태). → 계좌이체는 **카드처럼 `paid` + sale 트랜잭션**이어야 함.
- 가상계좌를 완전히 버리므로 **isBankTransfer 분기 제거 → 항상 paid + sale 트랜잭션**으로 단순화.
- refund* / vbank_due_date note_attributes(L67–72)도 함께 제거.
- ShippingData 타입(L36, L40–42)의 refund*·paymentMethod 정리.

### ③ `app/api/checkout/confirm/route.ts` — 🟢 거의 그대로 OK
- 계좌이체는 `confirmed.virtualAccount` 없음 → 기존 **"즉시 결제 경로"**로 자연 합류.
- CAPI Purchase도 L155(`!confirmed.virtualAccount`)에서 정상 발화.
- 손댈 것 거의 없음. (isVbank·vbank payload는 계좌이체에선 false/null로 떨어짐)

### ④ `app/api/toss/webhook/route.ts` — 🟢 죽은 코드화
- `VIRTUAL_ACCOUNT.DONE`은 계좌이체에 안 옴 → 미발화. 방치 무해, 추후 정리.
- `markShopifyOrderPaid`(order.ts)도 함께 미사용화 — 제거 시 동반 정리.

---

## 지금(온보딩 전) 안전하게 할 수 있는 것
- [x] 코드 파악 + 본 지도 작성
- [ ] **세금 과세여부 확인** — 상점관리자 부분면세 → 아동복 과세 맞는지 세무 확인 (코드 아님)
- [ ] **CHECKOUT_PAUSED 잠금 유지 확인** — `proxy.ts:39` 게이트. 실키 전환·런칭 전까지 Vercel env `CHECKOUT_PAUSED=true`로 잠가둘 것 (값 변경 전 현재값 확인)

## 진행 상황
1. [x] 4문항 확정(문서) → ① CheckoutForm(TRANSFER+escrowProducts, 환불UI 제거) ② order.ts(항상 paid+sale) ③ dictionaries/ko(계좌이체) 수정 — **2026-09-08 완료** (브랜치 `feat/toss-quick-transfer`, main 기준, 미커밋)
2. [x] `npx tsc --noEmit` + `npm run build` 통과
3. [ ] **⚠️ 테스트 키로 계좌이체 실결제 테스트** — 특히 **escrowProducts 금액합(상품소계) vs 결제액(+배송비) 불일치 시 토스 처리** 검증. 에러 시 배송비를 escrowProducts에 포함하는 등 조정.
4. [ ] Live 키 교체(.env.local + Vercel, 현재값 확인 후) → 실키 테스트
5. [ ] `CHECKOUT_PAUSED=false` 해제 → 런칭

## 참고 링크
- 결제현황·MID: `~/.claude/.../memory/project_toss_payment.md`
- 결제 폼: `components/checkout/CheckoutForm.tsx`
- 주문 생성: `lib/actions/order.ts`
