# applebuttercollege — 런칭 전 체크리스트

> 작업 완료 시 `[ ]` → `[x]` 로 변경.  
> 우선순위: 🔴 Critical → 🟠 High → 🟡 Medium → 🟢 Low (Post-launch)

---

## 🔴 Critical — 없으면 런칭 불가

### 환경 / 인프라
| 상태 | 항목 | 비고 |
|---|---|---|
| [ ] | Toss Payments 계약 완료 | 계약 전까지 결제 불가 |
| [ ] | `NEXT_PUBLIC_TOSS_CLIENT_KEY` 등록 | Vercel 환경변수 |
| [ ] | `TOSS_SECRET_KEY` 등록 | Vercel 환경변수 |
| [x] | Shopify Admin API 토큰 확보 (`shpat_`) | 결제 성공 → 주문 생성에 필수 |
| [ ] | `SHOPIFY_ADMIN_API_TOKEN` Vercel 등록 | |
| [ ] | Vercel 환경변수 전체 점검 | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `INSTAGRAM_ACCESS_TOKEN` 포함 |
| [ ] | 도메인 연결 (applebuttercollege.com → Vercel) | DNS 변경 + SSL 확인 |

### 코드
| 상태 | 항목 | 파일 |
|---|---|---|
| [x] | 404 에러 페이지 | `app/[lang]/not-found.tsx` |
| [x] | 500 에러 페이지 | `app/[lang]/error.tsx` (Client Component) |
| [x] | ABOUT 페이지 | `app/[lang]/(store)/about/page.tsx` |
| [x] | 결제 성공 페이지 다국어 | `app/[lang]/(store)/checkout/success/page.tsx` |
| [x] | 헤더 카트 수량 배지 | `components/layout/Header.tsx` |
| [x] | 컬렉션 페이지 | 태그 기반 필터링 + 정렬 완료 |

---

## 🟠 High — 런칭 직전까지

### 기능
| 상태 | 항목 | 파일 / 비고 |
|---|---|---|
| [ ] | CS 채널 플로팅 버튼 | 채널톡 또는 카카오 채널 스크립트 삽입 |
| [ ] | 검색 결과 전용 페이지 | `app/[lang]/(store)/search/page.tsx` — 현재 드롭다운만 |
| [ ] | 주문완료 페이지 상세 | 상품명·수량·금액·배송지 요약 표시 |
| [ ] | 제주/도서산간 배송비 결제 반영 | `components/checkout/CheckoutForm.tsx` — 현재 안내만, 실제 계산 미반영 |

### SEO / 기술
| 상태 | 항목 | 파일 |
|---|---|---|
| [ ] | robots.txt | `app/robots.ts` |
| [ ] | sitemap.xml | `app/sitemap.ts` — 상품 URL 포함 |
| [ ] | 기본 OG 이미지 | 홈·법적 페이지용 `og-default.png` + `app/layout.tsx` 메타 |
| [ ] | Product Structured Data (JSON-LD) | `app/[lang]/(store)/products/[id]/page.tsx` — 구글 쇼핑 노출 |
| [ ] | Google Search Console 등록 | 도메인 인증 |

### 운영 준비
| 상태 | 항목 | 비고 |
|---|---|---|
| [ ] | Shopify 주문 확인 이메일 한국어 템플릿 | Shopify Admin > 알림 |
| [ ] | 재고 부족 알림 임계값 설정 | Shopify Admin > 재고 |
| [ ] | 품절 상품 처리 정책 결정 | 숨김 vs 품절 표시 유지 |

---

## 🟡 Medium — 런칭 후 1개월 내

### 상품 탐색 UX
| 상태 | 항목 | 파일 |
|---|---|---|
| [ ] | 상품 카드 배지 (SALE / NEW / 품절) | `components/home/ProductGrid.tsx` |
| [ ] | 상품 카드 호버 시 두 번째 이미지 | `components/home/ProductGrid.tsx` |
| [x] | 컬렉션 정렬 (신상순 / 가격순 / 인기순) | 컬렉션 페이지 |
| [ ] | 재입고 알림 신청 | 품절 variant 버튼 영역 |
| [ ] | 최근 본 상품 | localStorage 기반 |

### 전환율
| 상태 | 항목 | 비고 |
|---|---|---|
| [ ] | 카카오톡 공유 버튼 | 상품 상세 페이지 |
| [ ] | 결제 단계 표시 (프로그레스 바) | 체크아웃 페이지 |
| [ ] | 빈 상태 디자인 | 검색 0건, 컬렉션 비었을 때 |

### 콘텐츠 / 운영
| 상태 | 항목 | 비고 |
|---|---|---|
| [ ] | Hero 이미지 CMS 관리 | 현재 코드 수정 필요 — Shopify 메타오브젝트 또는 환경변수로 전환 |
| [ ] | 공지사항 / 이벤트 배너 | 간단한 배너 관리 구조 필요 |
| [ ] | 네이버 쇼핑 피드 | `sitemap.xml` 완성 후 연동 |

### 접근성 / 품질
| 상태 | 항목 | 비고 |
|---|---|---|
| [ ] | 이미지 alt 텍스트 전수 검토 | 빈 `alt=""` 확인 |
| [ ] | 탭 영역 최소 44×44px | 모바일 소형 버튼 확인 |
| [ ] | focus-visible 스타일 | 키보드 탐색 접근성 |
| [ ] | 폰트 `font-display: swap` | `app/layout.tsx` |
| [ ] | 페이지 로딩 Suspense 경계 | 주요 동적 섹션 |
| [ ] | 색상 대비 WCAG AA 확인 | `ink-muted #9A8F88` — 배경 대비 |

---

## 🟢 Low — Post-launch (Phase 2~4)

| 상태 | 항목 | 비고 |
|---|---|---|
| [ ] | 포토 리뷰 시스템 | Judge.me / Yotpo 앱 연동 |
| [ ] | 위시리스트 (찜) | localStorage 또는 Shopify Customer API |
| [ ] | 회원 로그인 / 주문 내역 | Shopify Customer Account API |
| [ ] | 포인트 / 쿠폰 | Shopify Discounts API |
| [ ] | Meta CAPI 연동 | Purchase / AddToCart / ViewContent 이벤트 |
| [ ] | Stripe 연동 (일본 결제) | Phase 4 |
| [ ] | 일본어 특정상거래법 페이지 | Phase 4 |
| [ ] | MakeShop → Shopify 상품 bulk 이전 | Phase 2 |
| [ ] | MakeShop → Shopify 회원 이전 | 구매이력 보유 회원 우선 (~15,600명) |
| [ ] | Meta 픽셀 도메인 변경 | 전환 직후 |
| [ ] | 기존 URL 301 리다이렉트 | 메이크샵 URL → Shopify URL |
| [ ] | Google Search Console 도메인 변경 | |
| [ ] | WHOLESALE 문의 페이지 | 도매 거래 규모 확인 후 |

---

## 이미 완료된 항목

| ✅ | 항목 |
|---|---|
| ✅ | 상품 목록 / 상세 페이지 |
| ✅ | 장바구니 (추가·수정·삭제) |
| ✅ | 체크아웃 폼 + Toss SDK 연동 코드 |
| ✅ | 결제 성공 / 실패 페이지 (기본 구조) |
| ✅ | 사이즈 가이드 모달 (2XL·3XL 포함) |
| ✅ | 배송·교환·결제 안내 모달 (PolicyModal) |
| ✅ | 추천 상품 섹션 (랜덤, 품절 제외) |
| ✅ | 교환·반품 신청 폼 (`/[lang]/returns`) |
| ✅ | 다국어 ko/ja (사이즈 가이드·VariantSelector 포함) |
| ✅ | 인스타그램 피드 |
| ✅ | 푸터 리디자인 (사업자 정보 접기·이메일·전화 링크) |
| ✅ | 법적 페이지 (개인정보처리방침·이용약관·환불정책) |
| ✅ | 모바일 메뉴 |
| ✅ | 검색 바 (드롭다운) |
| ✅ | 모달 배경 스크롤 블락 |
| ✅ | SizeGuide 모바일 테이블 overflow-x-auto |
