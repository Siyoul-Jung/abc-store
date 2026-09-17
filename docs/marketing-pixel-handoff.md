# Meta 픽셀 운영 핸드오프 — 광고 담당자용

> 병행운영(메이크샵 자사몰 + Shopify 헤드리스) 중 Meta 픽셀·광고 운영 가이드.
> 작성: 개발팀 · 대상: 광고 담당자

---

## 1. 두 사이트 = 두 픽셀 (분리 측정)

병행운영이라 사이트가 **완전히 별개**이고, 픽셀도 **각각** 씁니다.

| 사이트 | URL | 픽셀 |
|---|---|---|
| 메이크샵 자사몰 (기존) | `applebuttercollege.com` | **자사몰 픽셀** (수년치 데이터, 기존 운영) |
| Shopify 헤드리스 (신규) | `abc-store-sigma.vercel.app` (추후 서브도메인) | **Shopify 전용 픽셀** (신규) |

- 두 픽셀은 **다른 픽셀**임을 확인 완료(2026-09-14). 매출·전환이 섞이지 않음.
- **자사몰 픽셀은 절대 건드리지 말 것** — 병행운영 중 분리 유지.
- Events Manager에서 픽셀 **이름**으로 구분(자사몰용 vs Shopify용).

## 2. 캠페인 운영 원칙

**광고 계정은 하나로 충분** — 픽셀을 나눈다고 계정을 나눌 필요 없음. 캠페인 단위로 구분:

| 캠페인 목적지 | 도착 URL | 전환 이벤트(최적화 픽셀) |
|---|---|---|
| 자사몰 유도 | `applebuttercollege.com` | 자사몰 픽셀 |
| Shopify 유도 | Shopify URL(vercel/서브도메인) | Shopify 픽셀 |

→ 도착 URL이 어느 사이트냐에 따라 그 사이트 픽셀이 발화. **캠페인 전환 이벤트를 도착지 사이트의 픽셀로 맞출 것.**

## 3. Shopify 픽셀 = 콜드 스타트 (중요)

- Shopify 픽셀은 **전환 이력 0**에서 시작 → **학습 단계(learning phase)**.
- 최적화 안정화엔 보통 **주당 전환 ~50건**(광고세트 기준) 필요.
- 병행운영 초기 Shopify는 물량이 적어 **Shopify 픽셀 최적화 광고는 당분간 비효율적**.
- 자사몰 픽셀(대량 데이터)과 출발선이 완전히 다름 — 같은 성과 기대 금지.

## 4. 병행운영 초기 권장 전략

1. **광고 예산은 자사몰 픽셀(검증 물량)에 유지.**
2. Shopify는 **오가닉·Link-only**(인스타·핀터레스트, 희소성/한정 신상)로 먼저 트래픽 → 픽셀 데이터 축적.
3. Shopify 전환이 쌓이면 그때 **Shopify 유료 광고 확대.**
4. 순서: 한정 신상 → Shopify Link 유도 → 픽셀 데이터 축적 → 광고 확장.

## 5. 서버 CAPI 이미 연동됨 (Shopify)

- Shopify 스토어는 **브라우저 픽셀 + 서버 CAPI** 동시 전송, `event_id`로 **dedup**(중복제거) 됨.
- Purchase는 서버(주문 확정 시)에서도 발화 → iOS/광고차단 환경에서도 **매칭 품질 확보**.
- 담당자는 픽셀 세팅 시 "CAPI 연동됨(브라우저+서버 dedup)"으로 인지하면 됨. 별도 CAPI 설정 불필요.
- 발화 이벤트: PageView · ViewContent(상품상세) · AddToCart · Purchase.

## 6. 핸드오프 체크리스트

- [ ] Meta Business Manager에서 **Shopify 픽셀을 광고 계정에 할당** + 담당자 권한 부여(관리자)
- [ ] Shopify 캠페인: 전환 이벤트 = **Shopify 픽셀** / 도착 URL = Shopify(vercel/서브도메인)
- [ ] Shopify 픽셀 **학습 단계** 감안 — 초기 성과 기대치 조정
- [ ] 자사몰 픽셀·캠페인은 **그대로 유지**(분리)
- [ ] (환경) `NEXT_PUBLIC_META_PIXEL_ID` = Shopify 픽셀 ID, Vercel 등록 완료

---

> 관련: `docs/pre-launch-integration-audit.md`(⑥ 픽셀 구현), `docs/team-decisions.md`(병행운영 정책)
