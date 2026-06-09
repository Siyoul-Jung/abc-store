@AGENTS.md

# applebuttercollege — 헤드리스 스토어프론트

아동복 브랜드 **applebuttercollege**의 Shopify 헤드리스 스토어프론트.  
한국(ko) + 일본(ja) 이중 언어 지원. 실제 도메인: **applebuttercollege.com**

> 런칭 전 체크리스트: `docs/launch-checklist.md`  
> 팀 논의·운영 결정사항: `docs/team-decisions.md`

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 16.2.4 (App Router) · React 19 |
| 스타일 | Tailwind CSS v4 (`@theme` 방식, tailwind.config 없음) |
| 상품 데이터 | Shopify Storefront API (`@shopify/storefront-api-client`) |
| 주문 생성 | Shopify Admin API (`lib/shopify/admin.ts` — `adminGql()` 사용, 토큰 확보 완료) |
| 결제 (한국) | Toss Payments v2 (`https://js.tosspayments.com/v2/standard`) |
| 결제 (일본) | Stripe (미구현, Phase 4 예정) |
| 배포 | Vercel |
| 인스타그램 피드 | Meta Graph API (system user token) |

---

## 라우팅 구조

```
app/
  [lang]/               ← Locale: 'ko' | 'ja' | 'en'
    (store)/
      page.tsx          ← 홈 (Hero + 상품 그리드 + 인스타 피드)
      products/
        page.tsx        ← 전체 상품 목록
        [id]/page.tsx   ← 상품 상세 (추천 상품 + JSON-LD 포함)
      collections/
        [handle]/       ← 핸들: new, kids, adult, sale (태그 기반 필터링, 정렬 지원)
      cart/page.tsx     ← 장바구니
      checkout/
        page.tsx        ← 체크아웃 (배송지 + 토스 결제)
        complete/       ← 결제 완료 표시 (순수 렌더, 새로고침 안전 — 부수효과 없음)
        fail/           ← 결제 실패
      (결제 성공 successUrl = /api/checkout/confirm 라우트 핸들러:
       Toss confirm → Shopify 주문 생성 → Meta CAPI → 쿠키정리 → complete로 redirect)
      account/          ← 마이페이지 (OIDC 로그인 필요)
        page.tsx        ← 계정 홈
        orders/         ← 주문내역 목록 + 상세, 주문 취소
        addresses/      ← 배송지 목록 + 추가/수정/삭제
      returns/          ← 교환·반품 신청 폼 (2단계: 주문조회 → 신청)
      qa/               ← Q&A 게시판 (목록, 상세, 새 질문) — Supabase
      about/            ← 브랜드 소개 페이지 (ko/ja)
      privacy/          ← 개인정보처리방침 (ko/ja 작성 완료)
      terms/            ← 이용약관 (ko/ja 작성 완료)
      refund/           ← 환불정책 (ko/ja 작성 완료)
  admin/
    qa/                 ← 관리자 Q&A 답변 페이지
  api/
    auth/               ← OIDC 로그인 (login, callback, logout)
    toss/webhook/       ← 가상계좌 입금 웹훅
    checkout/confirm/   ← 결제 성공 진입점: confirm·주문생성·CAPI·쿠키정리 → complete로 redirect
```

---

## 다국어 (i18n)

- URL 구조: `/{lang}/...` — `ko`, `ja` 두 locale만 유효
- 번역 파일: `dictionaries/ko.json`, `dictionaries/ja.json`
- 서버 컴포넌트에서 `getDictionary(locale)` 호출, props로 전달
- **locale 추가 시**: `lib/shopify/types.ts`의 `Locale` 타입, `dictionaries.ts`, `SizeGuide.tsx` 내부 `t` 객체 모두 수정 필요
- Shopify 상품 설명(descriptionHtml)은 Shopify Translate & Adapt에서 번역 관리

---

## 디자인 시스템 (`app/globals.css`)

> **전 페이지 일관성 규칙(버튼·라운드·여백·break-keep·Reveal 적용범위): `docs/design-rules.md`**
> 홈/About 유니클로풍 리디자인 레퍼런스 분석: `docs/design-reference-uniqlo.md`
> 아동복 Shopify 벤치마크(Mini Rodini) 분석 + 적용 가이드: `docs/design-reference-minirodini.md`

Tailwind v4 `@theme` 블록에서 커스텀 토큰 정의. `tailwind.config` 파일 없음.

| 토큰 | 값 | 용도 |
|---|---|---|
| `ink` | #1C1C1C | 본문 텍스트 |
| `ink-muted` | #9A8F88 | 보조 텍스트 |
| `surface` | #FAF7F3 (cream) | 카드, 푸터 배경 |
| `border` | #E8E3DC (line) | 구분선 |
| `coral` | oklch(57.7% 0.245 27.325) | CTA 버튼, 에러 |
| `citrus` | oklch(80% 0.148 72) | 배경 포인트 |
| `stone` | Tailwind 기본 stone | 품절 버튼 배경 |

폰트: Noto Sans KR/JP (본문) · Poppins (display/헤더)

---

## 비즈니스 룰

- **배송비**: 3,500원 / 80,000원 이상 무료 (`CheckoutForm.tsx`의 상수로 관리)
- **제주 추가**: +3,000원 / 도서산간 +4,000원 (PolicyModal 안내 전용, 결제 로직 미반영)
- **가격 표시**: 숫자 + 접미사 방식 — 한국: `원`, 일본: `엔` (`lib/utils/format.ts`)
- **PolicyModal**: 배송·교환·결제 안내 통합 모달. 상품 상세 VariantSelector 내 "안내 →" 버튼으로 트리거. 한국 locale에서만 렌더링.
- **PolicyAccordion**: 파일은 존재하나 상품 상세 페이지에서 더 이상 사용하지 않음 (PolicyModal로 대체)
- **사이즈 가이드**: `SizeGuide.tsx`에 하드코딩 (XS~3XL, 7개 사이즈). 모바일 overflow-x-auto 적용.

---

## Shopify 구성

- **Storefront API**: `lib/shopify/client.ts`에서 초기화
- **Admin API**: `lib/shopify/admin.ts`의 `adminGql()` 함수 사용. shpat_ 토큰 확보 완료.
- **컬렉션 핸들**: `new`, `kids`, `adult`, `sale`
- **상품 variants**: 사이즈 옵션명이 `Title`이면 단일 옵션으로 간주, 사이즈 버튼 미표시
- **카트 쿠키**: `cart_id` (httpOnly, 7일)
- **상품 정렬**: 홈은 `CREATED_AT desc` (신상순), 추천은 랜덤 (`Math.random()` + `unstable_noStore()`)

---

## 환경변수 (`.env.local`)

```
SHOPIFY_STORE_DOMAIN=               # 등록 완료
SHOPIFY_STOREFRONT_API_TOKEN=       # 등록 완료
SHOPIFY_STOREFRONT_API_VERSION=     # 등록 완료
SHOPIFY_ADMIN_API_TOKEN=            # shpat_ 토큰 등록 완료
SHOPIFY_CLIENT_ID=                  # OIDC 로그인용, 등록 완료
SHOPIFY_CLIENT_SECRET=              # OIDC 로그인용, 등록 완료
NEXT_PUBLIC_TOSS_CLIENT_KEY=        # 테스트 키 등록됨 — 실 계약 후 교체
TOSS_SECRET_KEY=                    # 테스트 키 등록됨 — 실 계약 후 교체
INSTAGRAM_ACCESS_TOKEN=             # 등록 완료
INSTAGRAM_USER_ID=17841436592849949
META_PIXEL_ID=                      # 등록 완료
META_CAPI_ACCESS_TOKEN=             # 등록 완료
NEXT_PUBLIC_SUPABASE_URL=           # 등록 완료 (Q&A 게시판)
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # 등록 완료
SUPABASE_SERVICE_ROLE_KEY=          # 등록 완료
ADMIN_SECRET=                       # 관리자 페이지 접근용
ADMIN_EMAIL=                        # 등록 완료
NEXT_PUBLIC_SITE_URL=               # 등록 완료
RESEND_API_KEY=                     # 등록 완료 (.env.local) — Q&A 답변/환불 알림 메일. 운영은 Vercel 등록 + 도메인(applebuttercollege.com) DKIM/SPF 인증 필요
```

---

## 컴포넌트 구조 (핵심)

```
components/
  layout/
    Header.tsx          ← 네비게이션, 카트 수량 배지 (coral), 로그인 상태 반영
    Footer.tsx          ← 사업자 정보(접기) + 연락처 링크 + 법적 링크
    MobileMenu.tsx      ← 전체화면 사이드바 (모바일 전용)
  home/
    ProductGrid.tsx     ← 상품 카드 그리드 (viewAllLabel 선택적)
    InstagramFeed.tsx   ← 3×3 그리드, 원본 비율 유지
  product/
    ProductImageGallery.tsx   ← 메인 이미지 (aspect-[3/4]) + 썸네일
    VariantSelector.tsx       ← 사이즈 선택 + 장바구니 버튼 + 상품설명/소재케어 아코디언
    SizeGuide.tsx             ← 신체기준 테이블 + 실측 아코디언 (XS~3XL, locale 번역)
    SizeGuideModal.tsx        ← SizeGuide를 모달로 표시 (ESC·배경클릭 닫기, 스크롤 블락)
    PolicyModal.tsx           ← 배송·교환·결제 안내 통합 모달 (ko/ja, 스크롤 블락)
    PolicyAccordion.tsx       ← 현재 미사용 (PolicyModal로 대체)
  returns/
    ReturnForm.tsx            ← 교환·반품 신청 2단계 폼 (주문조회 → 신청)
  checkout/
    CheckoutForm.tsx          ← 배송지 폼 + 토스 결제 위젯

lib/
  shopify/
    client.ts           ← Storefront API 클라이언트
    storefront.ts       ← 상품/카트 조회 함수
    admin.ts            ← Admin API adminGql() 함수
    customer-account.ts ← Customer Account API (caQuery, gidToId)
    queries/products.ts ← GraphQL 쿼리 (GET_PRODUCTS_QUERY, GET_BEST_SELLING_QUERY 등)
  actions/
    cart.ts             ← 장바구니 서버 액션
    returns.ts          ← 교환·반품 서버 액션 (lookupOrder, submitReturnRequest)
    order.ts            ← createShopifyOrder(), markShopifyOrderPaid()
  utils/
    format.ts           ← formatPrice(), gidToNumericId(), stripHtml() 등
  instagram.ts          ← Instagram Graph API 피드 조회
  meta-capi.ts          ← Meta Conversions API (sendCAPIEvent — Purchase 등)

app/
  api/
    auth/               ← OIDC 로그인 (login, callback, logout)
    toss/webhook/       ← 가상계좌 입금 웹훅 → markShopifyOrderPaid()
    checkout/confirm/   ← 결제 성공 진입점 → createShopifyOrder() → complete redirect
  [lang]/(store)/
    account/            ← 마이페이지 (주문내역, 주소관리) — 로그인 필요
    qa/                 ← Q&A 게시판 (목록, 상세, 새 질문)
  admin/
    qa/                 ← 관리자 Q&A 답변 페이지
```

---

## 현재 구현 상태

### 완료
- 상품 목록 / 상세 페이지 (추천 상품 섹션 포함)
- 장바구니 (추가, 수정, 삭제)
- 체크아웃 폼 + 토스 결제 SDK 연동 코드 (테스트 키)
- 결제 성공 → Toss confirm → Shopify 주문 생성 (`lib/actions/order.ts`)
- 결제 성공/실패 페이지 (ko/ja/en 다국어 완료)
- 가상계좌 입금 웹훅 (`app/api/toss/webhook/`) → markShopifyOrderPaid()
- 교환·반품 신청 폼 (`/[lang]/returns`) — Shopify Admin API `returnCreate` 연동
- 다국어 (ko/ja) 전반 — SizeGuide, VariantSelector, PolicyModal, ReturnForm 포함
- 인스타그램 피드
- 푸터 리디자인 — 사업자 정보 `<details>` 접기, 이메일·전화 클릭 링크
- 법적 페이지 (개인정보처리방침, 이용약관, 환불정책) — ko/ja 작성 완료
- 사이즈 가이드 모달 (VariantSelector 내 트리거, ESC·배경 클릭 닫기, 스크롤 블락)
- PolicyModal (배송·교환·결제 통합, "안내 →" 버튼 트리거, 스크롤 블락)
- SizeGuide 2XL·3XL 추가, 모바일 테이블 overflow-x-auto
- 모바일 메뉴 (전체화면 사이드바)
- 검색 바 (인라인 드롭다운)
- Hero 섹션 (홈페이지)
- 헤더 카트 수량 배지 (coral, 99+ 처리)
- 404 / 500 에러 페이지
- SEO — sitemap.xml, robots.txt, Product JSON-LD (`app/[lang]/(store)/products/[id]/page.tsx`)
- Meta Conversions API — `lib/meta-capi.ts`, Purchase 이벤트 (`app/api/checkout/confirm`)
- OIDC 로그인 (`app/api/auth/`) — Shopify Customer Account API, JWT id_token 디코딩
- 마이페이지 — 주문내역 (`/account/orders`), 주문 취소, 배송지 관리 (`/account/addresses`)
- Q&A 게시판 (`/qa`) — Supabase 기반, 목록/상세/새 질문, 관리자 답변 (`/admin/qa`)
- ABOUT 페이지 (ko/ja)
- 컬렉션 페이지 (태그 기반, new/kids/adult/sale)

### 미구현 / 미완성

> 상세 항목은 `docs/launch-checklist.md` 참조

**Phase 1 — 결제 완성 (토스 실 계약 직후)**
- 토스 실 키로 교체 (`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`)

**Phase 2 — 상품 데이터 이전**
- MakeShop → Shopify 상품 bulk 이전
- 일본어 상품 설명 번역 (Shopify Translate & Adapt)

**Phase 3 — 한국 런칭 준비**
- Vercel 환경변수 전체 등록
- 도메인 연결 (applebuttercollege.com)

**Phase 4 — 일본 런칭**
- Stripe 결제 연동
- 일본 특정상거래법 페이지

**Phase 5 — 대시보드 마이그레이션**
- 프로젝트: `abc-migration` (Plotly Dash v3.0, Python)
- MakeShop Open API → Shopify Admin API 커넥터 교체

**런칭 후**
- 포토 리뷰 (Judge.me 등)
- 위시리스트
- 포인트 / 쿠폰

---

## UX 원칙

**1원칙 — 모바일 구매 흐름 최우선**
- 구매자 대부분이 모바일로 접근 (인스타그램 → 모바일 구매 플로우가 핵심)
- 모든 UI 작업은 모바일 화면에서 먼저 검증
- 탭 영역, 폰트 크기, 여백, 스크롤 흐름이 모바일에서 자연스러워야 함
- 발견(인스타) → 탐색(상품 페이지) → 구매(체크아웃) 흐름이 끊기지 않게 설계
- 데스크톱은 모바일 기준에서 확장 (`sm:` breakpoint 활용)

---

## 주의사항 (하면 안 되는 것)

- `tailwind.config` 파일 생성하지 말 것 — v4는 `globals.css`의 `@theme`로 관리
- 서버 컴포넌트에서 `'use client'` 불필요하게 추가하지 말 것
- `getProductById`에 locale 인자 필수 — Shopify 다국어 컨텍스트 전달용
- 가격 표시 시 `Intl.NumberFormat` currency 스타일 사용 금지 — `formatPrice()` 사용
- Admin API 호출 시 `storefront.ts`에 직접 작성하지 말 것 — `lib/shopify/admin.ts`의 `adminGql()` 사용
- 배송비 상수는 `CheckoutForm.tsx`에서만 관리 (`SHIPPING_THRESHOLD = 80000`, `SHIPPING_FEE = 3500`)
- PolicyAccordion은 더 이상 상품 상세 페이지에서 사용하지 않음 — PolicyModal 사용
- 홈 상품 정렬(`CREATED_AT`)과 추천 상품 쿼리(`GET_BEST_SELLING_QUERY`)는 분리된 쿼리 사용
