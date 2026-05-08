# applebuttercollege — 프로젝트 현황

## 기술 스택
- Frontend: Next.js 16.2.4 (App Router, Turbopack)
- Backend/데이터: Shopify Storefront API (GraphQL)
- 스타일: Tailwind CSS v4 (OKLCH 컬러, @theme)
- 결제: 토스페이먼츠 (계약 전, 테스트 키로 개발 중)
- 배포: 미정 (Vercel 예정)

## 완료 ✅

### 인프라
- Shopify Storefront API 연동 (KR/JP @inContext)
- 다국어 라우팅 `/ko`, `/ja` (Accept-Language 자동 감지)
- 디자인 시스템 (OKLCH 브랜드 컬러, Noto Sans KR/JP)

### 페이지
- 홈페이지 — Hero (상품 이미지 split) + 신상품 캐러셀
- 상품 목록 `/products`
- 상품 상세 `/products/[id]`
- 장바구니 `/cart` — 수량 변경, 삭제
- 체크아웃 `/checkout` — 배송지 입력 + 토스페이먼츠 결제
- 결제 완료 `/checkout/success`
- 결제 실패 `/checkout/fail`
- 개인정보처리방침 `/privacy`
- 이용약관 `/terms`
- 환불정책 `/refund`

### 컴포넌트
- Header (데스크탑 nav + 모바일 드로어)
- Footer (법적 링크, CS)
- ProductCard, ProductImageGallery, VariantSelector
- CartLineItem (수량 조절)
- CheckoutForm (토스 SDK 연동, 동의 문구)

---

## 남은 작업

### 오픈 필수
- [ ] **Shopify Admin API 토큰 발급** (`shpat_` 타입, 현재 토큰 `shpss_`는 잘못된 타입)
- [ ] **Shopify 주문 생성** — 결제 성공 후 Admin API로 주문 생성 (`POST /admin/api/orders.json`)
- [ ] **Vercel 배포** + 도메인 연결
- [ ] **토스페이먼츠 계약 신청** (배포된 도메인 필요)
- [ ] **실 키 교체** (`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`)

### 있으면 좋음
- [ ] 헤더 장바구니 수량 뱃지
- [ ] 컬렉션 페이지 `/collections/[handle]`
- [ ] 채널톡 연동 (스크립트 한 줄)
- [ ] 인스타그램 피드 (Meta Graph API — 셋업 진행 중)

### 나중에
- [ ] MakeShop → Shopify 상품 이전 (bulk)
- [ ] 일본어 상품 설명 입력 (Shopify Translate & Adapt)
- [ ] 일본 PG 연동 (Stripe 등)
- [ ] SEO 최적화 (sitemap, og:image)

---

## 사업자 정보
- 상호: 주식회사 에이치에프에프에프
- 대표: 구승범
- 사업자등록번호: 846-81-02489
- 통신판매업: 제 2022-다산-1147 호
- 주소: 경기도 남양주시 다산순환로 20, 10층 제비에이 10-006호 (다산동)
- 이메일: applebuttercollege.official@gmail.com

## 환경변수 (.env.local)
- `SHOPIFY_STORE_DOMAIN` ✅
- `SHOPIFY_STOREFRONT_API_TOKEN` ✅
- `SHOPIFY_ADMIN_API_TOKEN` ❌ (잘못된 토큰 타입, 재발급 필요)
- `NEXT_PUBLIC_TOSS_CLIENT_KEY` ✅ (테스트 키)
- `TOSS_SECRET_KEY` ✅ (테스트 키)
