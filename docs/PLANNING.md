# applebuttercollege — 헤드리스 이커머스 구축 기획서

> Shopify + Next.js 16 기반 한국/일본 병렬 운영 웹사이트

---

## 1. 브랜드 개요

| 항목 | 내용 |
|---|---|
| 브랜드명 | applebuttercollege (애플버터컬리지) |
| 운영사 | 주식회사 에이치에프에프에프 |
| 대표 | 구승범 |
| 설립 | 2021년 3월 |
| 카테고리 | 아동복 (키즈 패션) |
| 사업자번호 | 846-81-02489 |
| 통신판매업 | 제 2022-다산-1147 호 |
| 주소 | 경기도 남양주시 다산순환로 20, 10층 제비에이 10-006호 |
| 인스타그램 | @applebuttercollege |
| 이메일 | applebuttercollege.official@gmail.com |

### 브랜드 정체성
- 감각적이고 미니멀한 아동복 브랜드
- 어린이의 일상을 특별하게 만드는 컨셉
- 시즌별 컬렉션 중심 운영 (SS / FW)
- 현재 이랜드몰 등 국내 유통채널 병행

---

## 2. 프로젝트 목표

### 핵심 목표
기존 메이크샵 기반 운영에서 **Shopify 헤드리스 + Next.js** 구조로 전환하여:
1. 한국 전용 커머스 사이트 구축 및 안정화
2. 일본 시장 진출을 위한 일본어 사이트 병렬 운영
3. 토스페이먼츠 연동으로 국내 결제 완성
4. 메이크샵 상품 데이터 Shopify로 마이그레이션

### 성공 지표
- 한국 사이트 오픈 및 실 결제 처리
- 일본 사이트 오픈 (일본어 상품 설명 + 일본 PG 연동)
- 채널톡 CS 시스템 연동
- 인스타그램 피드 홈페이지 노출

---

## 3. 기술 스택

### 프론트엔드
| 기술 | 버전 | 역할 |
|---|---|---|
| Next.js | 16.2.4 | 앱 프레임워크 (App Router, Turbopack) |
| React | 19 | UI |
| Tailwind CSS | v4 | 스타일링 (@theme OKLCH 컬러) |
| TypeScript | 5 | 타입 안전성 |

### 백엔드/데이터
| 기술 | 역할 |
|---|---|
| Shopify Storefront API | 상품, 컬렉션, 장바구니 (public) |
| Shopify Admin API | 주문 생성, 재고 관리 (서버 전용) |
| Next.js Server Actions | 장바구니 뮤테이션, 결제 확인 |

### 결제
| 마켓 | PG | 상태 |
|---|---|---|
| 한국 | 토스페이먼츠 | 계약 진행 예정, 테스트 키로 개발 중 |
| 일본 | 미정 (Stripe 등) | 추후 연동 |

### 인프라
| 항목 | 내용 |
|---|---|
| 배포 | Vercel (예정) |
| 도메인 | 미정 |
| 이미지 CDN | Shopify CDN (cdn.shopify.com) |
| CS | 채널톡 (연동 예정) |

---

## 4. 다국어 아키텍처

```
/ko/...   → 한국 시장 (KRW, 한국어, 토스페이먼츠)
/ja/...   → 일본 시장 (JPY, 일본어, 일본 PG)
```

- `proxy.ts`: Accept-Language 헤더로 자동 리다이렉트
- Shopify `@inContext(country, language)`: 가격/통화/상품설명 자동 현지화
- `dictionaries/ko.json`, `dictionaries/ja.json`: UI 텍스트 분리 관리
- 일본어 상품 설명: Shopify Translate & Adapt 앱으로 직접 입력 (번역기 미사용)

---

## 5. 사이트 구조 (라우트)

```
/[lang]/
├── (store)/
│   ├── page.tsx              # 홈 (Hero + 신상품)
│   ├── products/
│   │   ├── page.tsx          # 상품 목록
│   │   └── [id]/page.tsx     # 상품 상세
│   ├── collections/
│   │   └── [handle]/page.tsx # 컬렉션 (예정)
│   ├── cart/page.tsx         # 장바구니
│   ├── checkout/
│   │   ├── page.tsx          # 배송지 + 결제
│   │   ├── success/page.tsx  # 결제 완료
│   │   └── fail/page.tsx     # 결제 실패
│   ├── privacy/page.tsx      # 개인정보처리방침
│   ├── terms/page.tsx        # 이용약관
│   └── refund/page.tsx       # 환불정책
```

---

## 6. 디자인 시스템

### 컬러
| 토큰 | 값 | 용도 |
|---|---|---|
| `cream` | #FAF7F3 | 배경 (기본) |
| `ink` | #1C1C1C | 텍스트 (기본) |
| `ink-muted` | #9A8F88 | 최소한의 보조 텍스트만 |
| `citrus` | oklch(80% 0.148 72) | SALE·NEW 뱃지, placeholder 배경 |
| `coral` | oklch(57.7% 0.245 27.325) | 결제·구매 핵심 액션 버튼만 |
| `line` | #E8E3DC | 구분선, 테두리 |

### 텍스트 원칙
- 밝은 배경(cream/white) → **black(ink) 텍스트**
- 컬러 배경(coral/citrus) → **white 텍스트**
- `ink-muted` 는 가격, copyright 등 진짜 보조 정보에만 최소 사용

### 버튼 3단계
| 종류 | 스타일 | 용도 |
|---|---|---|
| Primary | `bg-coral text-white` | 장바구니 담기, 결제하기 |
| Secondary | `border border-ink text-ink` | 컬렉션 보기, 더보기 |
| Ghost | 텍스트 + `→` | 전체보기, 보조 링크 |

### 타이포그래피
- 한국: Noto Sans KR Variable
- 일본: Noto Sans JP Variable

---

## 7. 개발 단계

### Phase 1 — 한국 사이트 오픈 (진행 중)
- [x] Shopify API 연동
- [x] 상품 목록 / 상세 페이지
- [x] 장바구니 (Shopify Cart API)
- [x] 체크아웃 + 토스페이먼츠 연동 (테스트)
- [x] 법적 페이지 3종
- [ ] Shopify 주문 생성 (Admin API)
- [ ] Vercel 배포 + 도메인
- [ ] 토스페이먼츠 계약 → 실 키 교체

### Phase 2 — 기능 보완
- [ ] 컬렉션 페이지
- [ ] 헤더 장바구니 수량 뱃지
- [ ] 채널톡 CS 연동
- [ ] 인스타그램 피드 (Meta Graph API)
- [ ] SEO (sitemap, og:image, 메타데이터)

### Phase 3 — 일본 사이트 오픈
- [ ] Shopify 일본어 상품 설명 입력 (Translate & Adapt)
- [ ] 일본 PG 연동 (Stripe 등)
- [ ] 일본 배송 정책 반영
- [ ] ja.json UI 텍스트 원어민 검수

### Phase 4 — 데이터 이전
- [ ] 메이크샵 상품 데이터 추출
- [ ] Shopify Bulk Upload 스크립트
- [ ] 재고/이미지 마이그레이션

---

## 8. 결제 플로우 (한국)

```
장바구니 → /checkout
  ↓ 배송지 입력
  ↓ 토스페이먼츠 requestPayment()
  ↓ [Toss 결제창]
  ↓ 성공 시 /checkout/success?paymentKey=...&orderId=...&amount=...
  ↓ 서버: Toss confirm API 호출 (시크릿 키 서버 전용)
  ↓ 서버: Shopify Admin API로 주문 생성
  ↓ 장바구니 쿠키 삭제
  ↓ 주문 완료 화면
```

---

## 9. 환경변수

| 변수 | 상태 | 비고 |
|---|---|---|
| `SHOPIFY_STORE_DOMAIN` | ✅ | vcr0br-23.myshopify.com |
| `SHOPIFY_STOREFRONT_API_TOKEN` | ✅ | Public token |
| `SHOPIFY_ADMIN_API_TOKEN` | ❌ | `shpss_` 타입 오류 → `shpat_` 재발급 필요 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | ✅ | 테스트 키 |
| `TOSS_SECRET_KEY` | ✅ | 테스트 키 (서버 전용) |

---

## 10. 토스페이먼츠 계약 체크리스트

- [x] 개인정보처리방침 페이지
- [x] 이용약관 페이지
- [x] 환불정책 페이지
- [ ] 사이트 실 도메인 배포
- [ ] 사업자등록증 제출
- [ ] 통신판매업 신고증 제출
- [ ] 계약 신청 → 실 키 발급
