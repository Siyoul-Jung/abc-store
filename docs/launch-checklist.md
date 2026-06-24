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
| [x] | `SHOPIFY_ADMIN_API_TOKEN` Vercel 등록 | Production 등록 확인 완료 (`vercel env ls`) |
| [x] | 토스 웹훅 서명검증 구현 | `app/api/toss/webhook/route.ts` — fail-closed, 테스트 통과 |
| [ ] | `TOSS_WEBHOOK_SECRET` 등록 (`.env.local` + Vercel) | 토스 지급대행 설정의 **보안 키** (API 시크릿과 별개). 미등록 시 모든 웹훅 401 거부 |
| [ ] | Vercel 환경변수 전체 점검 | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `INSTAGRAM_ACCESS_TOKEN` 포함 |
| [x] | Supabase 정지/백업 대응 | keep-alive 핑 구현 완료(`app/api/cron/keep-alive` + vercel.json cron 매일 03:00 UTC, answer_templates head count). 무료 플랜 7일 무활동 정지 방지. 백업이 필요하면 추후 Pro($25/월) 별도 검토 |
| [ ] | 도메인 연결 (applebuttercollege.com → Vercel) | DNS 변경 + SSL 확인 |

### 법적 표시 (아동복 이커머스 의무사항)
| 상태 | 항목 | 비고 |
|---|---|---|
| [x] | **KC 인증 표시** (어린이제품 안전특별법) | 상품 상세에 상품정보제공고시 테이블 구현 (`ProductDisclosure.tsx`, ko 전용). 공급자적합성확인 필 + KATRI 성적서번호(KIKO25-00005662) 표기. ⚠️ 잔여: 라벨에 사용연령·모델명 추가, XS/S 유아용(36개월 미만) 구간 판매 정책 결정 — `docs/team-decisions.md` §4 |
| [ ] | 현금영수증 발급 체계 | 토스 가상계좌 자동발급(cashReceipt) 계약 범위 확인. 임시: Q&A 접수 → 토스 대시보드 수동 발급 (FAQ에 안내됨) |
| [ ] | 에스크로(구매안전서비스) 표시 | 가상계좌 수취 시 의무. 토스 계약에 포함 여부 확인 → 푸터/체크아웃 표시 |
| [x] | FAQ 콘텐츠 전수 검수 | 기존 자사몰 기준 거짓 정보(적립금·1시간취소·이메일채널) 교정 완료 |
| [x] | 통신판매업신고번호 표시 | 푸터 사업자 정보 (2022-다산-1147) |

### 코드
| 상태 | 항목 | 파일 |
|---|---|---|
| [x] | 다음 우편번호 검색 연동 | `components/checkout/AddressSearchModal.tsx` — 모바일 주소 입력 마찰 제거 |
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
| [x] | CS 채널 플로팅 버튼 | Q&A 게시판 1:1 문의로 대체 (채널톡 미사용) |
| [x] | 검색 결과 전용 페이지 | `app/[lang]/(store)/search/page.tsx` — Shopify SEARCH_QUERY 조회 + ProductGrid + 무결과 안내(빈 상태) 완료 |
| [x] | 주문완료 페이지 상세 | 상품명·옵션·수량·라인합계·결제금액·배송지·가상계좌 안내까지 표시 (`checkout/complete/page.tsx` ← confirm 라우트가 `order_confirmation` 쿠키로 전달) |
| [x] | 제주/도서산간 배송비 결제 반영 | 우편번호 63xxx 자동감지(+3,000) / 도서산간 체크박스(+4,000) → 결제금액·shipping_lines 반영. 우편번호 5자리 필수 검증 포함 |

### SEO / 기술
| 상태 | 항목 | 파일 |
|---|---|---|
| [x] | robots.txt | `app/robots.ts` |
| [x] | sitemap.xml | `app/sitemap.ts` — 상품 URL 포함 |
| [x] | 기본 OG 이미지 | `public/og-default.png`(5000×2625) + `app/[lang]/layout.tsx`에 openGraph.images·twitter summary_large_image·metadataBase 연결 완료 |
| [x] | Product Structured Data (JSON-LD) | `app/[lang]/(store)/products/[id]/page.tsx` — 구글 쇼핑 노출 |
| [ ] | Google Search Console 등록 | 도메인 인증 |

### 운영 준비
| 상태 | 항목 | 비고 |
|---|---|---|
| [x] | Shopify 주문 확인 이메일 (send_receipt) | `order.ts`에서 활성화 완료 — 이메일 수집 주문에 발송(카드=영수증/무통장=주문접수). ⚠️ 한국어 템플릿 커스터마이징은 Shopify Admin>설정>알림 (미적용 시 Shopify 기본 템플릿으로 발송) |
| [ ] | 재고 부족 알림 임계값 설정 | **결정: 3개**. Shopify Admin>설정>알림 또는 재고에서 적용 필요(코드 아님) |
| [x] | 품절 상품 처리 정책 결정 | **표시 유지 확정** — 재입고 알림(RestockNotify) 활용. 메인/컬렉션 목록은 품절을 안 거름(품절 배지). `available_for_sale:true` 필터는 추천 쿼리에만(의도) |
| [x] | 반품 목록 CSV 다운로드 | `/admin/returns` → 배송팀 전달용. 현재 필터 그대로 내보내기 (UTF-8 BOM) |

---

## 🟡 Medium — 런칭 후 1개월 내

### 상품 탐색 UX
| 상태 | 항목 | 파일 |
|---|---|---|
| [x] | 상품 카드 배지 (SALE / NEW / 품절) | `ProductGrid.tsx` — 좌상단 배지 스택 (품절 우선, SALE coral, NEW=new태그) |
| [x] | 상품 카드 호버 시 두 번째 이미지 | `SwipeableProductImages.tsx` — 데스크톱 호버 시 2번째로 smooth scroll (모바일 무영향) |
| [x] | 컬렉션 정렬 (신상순 / 가격순 / 인기순) | 컬렉션 페이지 |
| [x] | 재입고 알림 신청 | 품절 variant 선택 시 이메일 폼 (`RestockNotify.tsx` + `restock.ts`). ⚠️ 운영 전 `docs/sql/2026-06-22-restock-subscriptions.sql` 실행 필요 |
| [x] | 최근 본 상품 | `RecentlyViewed.tsx` — localStorage, 상세 하단 가로 스크롤 |

### 전환율
| 상태 | 항목 | 비고 |
|---|---|---|
| [x] | 카카오톡 공유 버튼 | `ShareButtons.tsx` — Kakao(NEXT_PUBLIC_KAKAO_JS_KEY 있을 때) + navigator.share/링크복사 폴백 |
| [ ] | 결제 단계 표시 (프로그레스 바) | 체크아웃이 단일 페이지라 보류 — 단계 표시가 부정확·저가치 |
| [x] | 빈 상태 디자인 | 검색 0건·컬렉션·장바구니 빈 상태 완료 |

### 콘텐츠 / 운영
| 상태 | 항목 | 비고 |
|---|---|---|
| [x] | Hero 이미지 env 관리 | `HERO_SLIDES`(JSON 배열 `[{src,alt}]`) env로 주입, 미설정 시 코드 내장 기본. 시즌 교체 시 Vercel env만 변경. 메타오브젝트(어드민 업로드)는 추후 |
| [x] | 공지사항 / 이벤트 배너 | `NoticeBanner.tsx` — 환경변수(NEXT_PUBLIC_NOTICE_KO/_JA/_LINK)로 관리, dismiss 가능 |
| [ ] | 네이버 쇼핑 피드 | `sitemap.xml` 완성 후 연동 |

### 접근성 / 품질
| 상태 | 항목 | 비고 |
|---|---|---|
| [x] | 이미지 alt 텍스트 전수 검토 | 감사 결과 의미있는 이미지 모두 alt 보유(상품·로고·콘텐츠) |
| [x] | 탭 영역 44×44px (핵심 구매흐름) | 헤더 계정·카트·햄버거·메뉴닫기, 장바구니 수량(40px)·삭제, Hero 인디케이터 확대 완료. 잔여(일부 모달 닫기·검색 아이콘)는 후속 |
| [x] | focus-visible 스타일 | `globals.css` — 키보드 포커스 시 ink 윤곽선 |
| [x] | 폰트 `font-display: swap` | @fontsource CSS에 기본 포함됨(확인 완료) — 별도 설정 불필요 |
| [ ] | 페이지 로딩 Suspense 경계 | 데이터 페칭 구조 변경 필요(스트리밍 SSR) — 별도 작업으로 보류 |
| [x] | 색상 대비 WCAG AA | `ink-muted` 토큰 #9A8F88→**#736E66** (흰 5.06:1 / 크림 4.74:1, 본문 4.5:1 통과). 가격은 `text-ink`. ⚠️ 잔여: `text-ink-muted/70` 등 투명도 적용처는 효과 대비 낮아질 수 있음(장식 라벨) |

---

## 🟢 Low — Post-launch (Phase 2~4)

| 상태 | 항목 | 비고 |
|---|---|---|
| [ ] | 포토 리뷰 시스템 | Judge.me / Yotpo 앱 연동 |
| [ ] | 위시리스트 (찜) | localStorage 또는 Shopify Customer API |
| [x] | 회원 로그인 / 주문 내역 | Shopify Customer Account API (OIDC 완료) |
| [ ] | 포인트 / 쿠폰 | Shopify Discounts API |
| [x] | Meta CAPI 연동 | Purchase 이벤트 완료 (`checkout/success`) |
| [ ] | Stripe 연동 (일본 결제) | Phase 4 |
| [ ] | 일본어 특정상거래법 페이지 | Phase 4 |
| [ ] | MakeShop → Shopify 상품 bulk 이전 | Phase 2. ⚠️ 이전 시 **상품정보제공고시 필수 항목**(소재·치수·제조국·세탁법·품질보증기준·AS책임자) + **KC 인증번호**를 상품 데이터에 포함할 것 (전자상거래법·어린이제품법) |
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
