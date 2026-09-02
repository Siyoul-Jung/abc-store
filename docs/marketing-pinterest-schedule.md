# 핀터레스트 발행 운영 모델 + 큐

> 매번 "뭘 어떻게 올리지" 고민하지 않도록 정해둔 **운영 원칙 + 발행 리듬 + 대기열**.
> 핀 만드는 법·유형은 [marketing-content-roadmap.md](marketing-content-roadmap.md), 발행 절차는 [marketing-pinterest-pipeline.md](marketing-pinterest-pipeline.md).

**Pinterest API 발행기 완성 — 단, 앱이 Trial access라 production 발행 불가(2026-07-13 확인).** 발행기 `marketing/publish-pinterest.mjs` 구축 — `.publish-job.json`(imagePath·title·description·link·altText) + access token으로 **여름 아동복 보드**(`PINTEREST_BOARD_ID`)에 `POST /v5/pins` 발행. access token 30일·refresh 60일, 401 시 자동 갱신.
>
> ⚠️ **블로커: 앱 등급 = Trial access.** 07-13 실발행 시도 → `403 code 29: Apps with Trial access may not create Pins in production`. 스코프(boards:write·pins:write·user_accounts:read)·토큰·payload 전부 정상, dry-run도 통과 — **마지막 게이트는 앱 등급.** 정식 발행은 **Standard access 승격 심사** 필요(developers.pinterest.com → App 1582194 → Upgrade). 승격 전까지는 **수동 업로드로 발행 지속.** 승격되면 동일 코드로 즉시 자동발행 개방.
> - 스코프는 07-13 재인증으로 `boards:read boards:write pins:read pins:write user_accounts:read` 5종 확보(user_accounts:read=분석 API용).
> - Vercel 발행 시 PINTEREST_* env 등록 필요(현재 .env.local만).

---

## 핀 운영 3원칙 (먼저 읽기)

**1) 핀 = 사이트로 들어오는 문 하나. standalone(단일 이미지) 위주.**
- 핀터레스트는 검색엔진 → 핀 1장 = 독립 검색결과 1개.
- ❌ 멀티카드 묶음(5장 세트)의 **커버 1장만** 올리는 건 비효율 — 그건 캐러셀 전제 디자인이라 단독으론 클릭 유인이 약하다.
- ✅ 5장짜리 랭킹/데일리 덱은 **각 상품 카드를 개별 핀**으로 쪼개 올린다 (한 상품 = 한 핀 = 한 검색결과).

**2) 핀 3종 믹스.**
| 종류 | 역할 | 목적지 링크 |
|---|---|---|
| **상품핀** (주력) | 검색 커버리지·직행 클릭 | 해당 상품 페이지 |
| **큐레이션핀** (콜라주) | 폭넓은 유입("여름 세트 모음") | 컬렉션/기획전 |
| 정보핀 (후순위) | 트래픽 검증 후 도입 | — |

**3) 양보다 꾸준함. 성공지표는 노출이 아니라 outbound clicks.**
- 신규 계정은 일관된 리듬에 보상이 큼. 폭발 발행 후 멈춤이 최악.
- 핀터레스트 인덱싱에 **2~6주** 소요 + 도메인 인증 후 분배 증가 → **초기 조회 1~4는 정상.** 이틀치 조회수로 판단 금지.

---

## 주간 리듬 — 주 3회 (월·수·금)

| 요일 | 유형 (기본 배치) | 이유 |
|---|---|---|
| **월** | 단일 상품핀 | 한 주 시작, 상품 직접 노출 |
| **수** | 큐레이션 (콜라주/시즌) | 스타일 검색 유입 |
| **금** | 단일 상품핀 (랭킹 덱의 상품 카드 활용) | 주말 쇼핑 전 |

> 도배 금지(하루 여러 장 X). 한 슬롯 = 핀 1장. 못 올린 날은 건너뛰고 다음 슬롯에.
> 콘텐츠 여유가 생기면 주말 1회 추가해 주 4회까지. **무리해서 늘리지 말 것.**

---

## 발행 큐 (위에서부터 순서대로)

| # | 예정일 | 유형 | 핀 이미지 | 캡션 | 상태 |
|---|---|---|---|---|---|
| — | 06-19(금) | 큐레이션·랭킹 커버 | `summer-bestsellers-2x3-01` | `summer-bestsellers-captions.md` | ✅ 발행됨(커버) |
| — | 06-21(토) | 큐레이션·시즌 커버 | `summer-daily-2x3-01` | `summer-daily-captions.md` | ✅ 발행됨(커버) |
| — | 06-23(월) | 큐레이션·콜라주 | `pinterest/curation/collage/summer-collage-2x3-01` | `summer-collage-captions.md` | ✅ 발행됨 |
| — | 06-24(화) | 큐레이션·콜라주 (신규 나시) | `pinterest/curation/collage/mesh-summer-2x3-01` | `mesh-summer-captions.md` | ✅ 발행됨 |
| — | 06-24(화) | 큐레이션·콜라주 (신상) | `pinterest/curation/collage/new-abc-skin-2x3-01` | `new-abc-skin-captions.md` | ✅ 발행됨(수 슬롯 당겨 발행) |
| — | 06-28(월) | 단일 상품핀 (트럭) | `pinterest/product/product-spotlight-0627-2x3-02` | 오프로드 트럭(자동차 패턴), 상품 직링크 branduid=11331198 | ✅ 발행됨 |
| — | 06-30(수) | 큐레이션·콜라주 (피그 패밀리) | `pinterest/curation/collage/pig-family-2x3-01` | `pig-family.mjs` | ✅ 발행됨(수동, API 이전 마지막) |
| — | 07-02~07-20 | 발행 공백 | — | — | ⏭ 건너뜀 |
| — | 07-22(수) | 큐레이션·콜라주 (동물 친구 모음) | `pinterest/curation/collage/animal-friends-0715-2x3-01` | 문어·악어·달팽이·풍선공룡, KIDS 컬렉션 utm=animal-friends-0715 | ✅ 발행됨(수동) |
| 1 | 07-25(금) or 07-27(월) | 단일 상품핀 (병아리 튜브 — 뱅킹됨) | `pinterest/product/product-spotlight-0713-2x3-01` | 물놀이룩, KIDS 컬렉션 utm=chick-tube-0713 | ⬜ 다음 단일핀 슬롯 |

> ⚠️ `summer-mesh-set` 덱은 **폐기**(발행 안 함) — 이미 올린 `mesh-summer`와 상품 3/4 중복이라 near-duplicate. 삭제함.
> 🔁 **발행 전 필수 대조**: 새 콜라주 소재는 이미 발행된 덱(mesh-summer·new-abc-skin·pig-family·summer-*)과 상품·테마가 겹치지 않는지 확인할 것.

> ⚠️ 이미 올린 두 커버는 caption만 단독으론 약함 — **재방문 트래픽용으로 유지**하되, 앞으로는 standalone 상품핀 위주로 전환.
> ✅ 핀 이미지에 **가격 미표기** 정책 — evergreen 핀이라 가격 변동 시 박제됨. 실시간 가격은 상품 페이지에서.
> ⚠️ 재마이그레이션으로 덱의 Shopify CDN 이미지 URL이 깨졌을 수 있음 — 발행 전 새 URL로 교체(`marketing/decks/*.mjs`의 `IMG`).
> 🔧 **선행 작업 필요**: 랭킹/데일리 덱의 상품 카드를 개별 핀으로 뽑는 출력 구조 정비 (아래 "구조 정비" 참고).
> ⏸ **사이즈 가이드 정보핀은 보류** — 정보핀은 핀 위에서 답을 다 줘 클릭률 낮음. 트래픽 검증 후 도입.

---

## 구조 정비 (다음 작업)

현재 엔진은 랭킹/시즌 덱을 `cover → rank×N → cta` 캐러셀 전제로 출력한다.
standalone 운영에 맞추려면 **각 rank 카드가 그 자체로 완결된 단일 핀**이 되도록(브랜드/키워드/사이즈 노출) 보강이 필요하다.
→ `marketing/card-news-generator.mjs`의 `renderRank` + 캡션 생성(`buildCaptions`)을 상품핀 수준으로 정비.

---

## 큐가 바닥나면

새 소재를 `marketing/decks/`에 추가하고 재생성:
```
node marketing/card-news-generator.mjs
node marketing/export-png.mjs <slug>
```
소재 아이디어는 [marketing-content-roadmap.md](marketing-content-roadmap.md) 유형별 표 참고
(시즌: 물놀이룩·등원룩 / 단일 상품핀: 전 상품 — 상품컷 보강 후).

---

## 발행 시 체크 (핀터레스트 Create Pin)

- [ ] 세로 2:3 이미지 업로드 (`marketing/output/png/pinterest/...`)
- [ ] 제목·설명 = 캡션 파일 복붙 (검색 키워드 포함)
- [ ] **링크(목적지 URL)** 입력 ← 트래픽 핵심 (UTM 포함). 런칭 전엔 현재 라이브몰, 런칭 후 Shopify URL
- [ ] 보드 선택 (주제별: "여름 아동복", "키즈 코디" 등)
- [ ] **Organic > Create Pin** 사용 (Paid = 광고, 사용 안 함)
- [ ] 발행 → 며칠 뒤 Analytics에서 **아웃바운드 클릭** 확인 (노출 아님)
