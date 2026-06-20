# 핀터레스트 발행 일정 (큐)

> 매번 "뭘 올리지" 고민하지 않도록 정해둔 발행 리듬 + 대기열.
> **규칙: 주 3회(월·수·금), 큐 맨 위 핀을 하나씩 올리고 ✅ 체크.** 끝나면 다음으로 내려간다.
> 핀 만드는 법·유형은 [marketing-content-roadmap.md](marketing-content-roadmap.md), 발행 절차는 [marketing-pinterest-pipeline.md](marketing-pinterest-pipeline.md).

승인(핀터레스트 API) 전까지는 **수동 발행**. 승인 후엔 이 큐를 자동 발행 파이프라인이 그대로 소비.

---

## 주간 리듬

| 요일 | 유형 (기본 배치) | 이유 |
|---|---|---|
| **월** | 단일 상품핀 | 한 주 시작, 상품 직접 노출 |
| **수** | 큐레이션 (시즌/데일리) | 스타일 검색 |
| **금** | 큐레이션(랭킹) 또는 정보형 | 주말 쇼핑 전 |

> 도배 금지(하루 여러 장 X). 한 슬롯 = 핀 1장. 못 올린 날은 건너뛰고 다음 슬롯에.

---

## 발행 큐 (위에서부터 순서대로)

| # | 예정일 | 유형 | 핀 이미지 | 캡션 |
|---|---|---|---|---|
| 1 | 06-19(금) | 큐레이션·랭킹 | `pinterest/curation/ranking/summer-bestsellers-2x3-01` (커버) | `summer-bestsellers-captions.md` | ✅ 완료 |
| 2 | 06-23(월) | 단일 상품핀 | `pinterest/product/product-pins-2x3-01` (피그 베이비핑크) | `product-pins-captions.md` | ⬜ |
| 3 | 06-25(수) | 정보형 | `pinterest/info/sizeguide-2x3-01` (사이즈 가이드) | `sizeguide-captions.md` | ⬜ |
| 4 | 06-27(금) | 큐레이션·시즌 | `pinterest/curation/seasonal/summer-daily-2x3-01` (여름 데일리 커버) | `summer-daily-captions.md` | ⬜ |
| 5 | 06-30(월) | 단일 상품핀 | `pinterest/product/product-pins-2x3-02` (핑크 공룡) | `product-pins-captions.md` | ⬜ |
| 6 | 07-02(수) | 큐레이션·랭킹 | `pinterest/curation/ranking/summer-bestsellers-2x3-02` (랭킹 2위) | `summer-bestsellers-captions.md` | ⬜ |
| 7 | 07-04(금) | 단일 상품핀 | `pinterest/product/product-pins-2x3-03` (허니베어) | `product-pins-captions.md` | ⬜ |

> 경로 기준: `marketing/output/png/...` · 캡션 기준: `marketing/output/...`
> ⚠️ **단일 상품핀은 가격이 placeholder(32,000원)** — 발행 전 실제 가격으로 교체(`marketing/decks/product-pins.mjs`).

---

## 큐가 바닥나면

새 소재를 `marketing/decks/`에 추가하고 재생성하면 큐에 채울 핀이 늘어난다:
```
node marketing/card-news-generator.mjs
node marketing/export-png.mjs <slug>
```
소재 아이디어는 [marketing-content-roadmap.md](marketing-content-roadmap.md)의 유형별 표 참고
(시즌: 물놀이룩·등원룩 / 정보형: 세탁 가이드 / 단일 상품핀: 전 상품 — 상품컷 보강 후).

---

## 발행 시 체크 (핀터레스트 Create Pin)

- [ ] 이미지 업로드 (위 경로)
- [ ] 제목·설명 = 캡션 파일 복붙
- [ ] **링크(목적지 URL)** 입력 ← 트래픽 핵심 (UTM 포함된 캡션의 링크)
- [ ] 보드 선택 (예: "여름 아동복")
- [ ] **Organic > Create Pin** 사용 (Paid = 광고, 사용 안 함)
- [ ] 발행 → 며칠 뒤 Analytics에서 아웃바운드 클릭 확인
