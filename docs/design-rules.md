# 디자인 규칙 (Design Rules) — applebuttercollege

> 작성: 2026-06-03 · **전 페이지 일관성의 단일 기준 문서**
> 목적: 색·버튼·라운드·여백·타이포의 표준값을 고정해, 페이지마다 갈라지지 않게 한다.
> 적용 대상: `app/[lang]/(store)/**` 고객 화면 (admin은 별도, 우선순위 낮음)
>
> 모범 사례(이미 준수): `components/home/Hero.tsx`, `app/[lang]/(store)/about/page.tsx`, 상품상세 `products/[id]`

---

## 1. 색 (Color) — 토큰만 사용

`globals.css`의 `@theme` 토큰 **외의 색 사용 금지** (`bg-red-600`, `text-gray-500` 등 ❌).

| 토큰 | 용도 |
|---|---|
| `white` / `cream`(=surface) | 배경. 섹션 교차 시 흰 ↔ cream |
| `ink` | 본문·제목 텍스트, **2순위 버튼 배경** |
| `ink-muted` | 보조 텍스트, 라벨, 비활성 |
| `line`(=border) | 구분선·테두리 |
| `coral` | **1순위 CTA 배경** + 작은 강조 포인트(라벨·표식) |
| `citrus` | 배경 포인트 전용 (글자색으로 쓰지 말 것) |

> ✅ 현재 전 페이지가 토큰만 사용 중 — 이 규칙은 이미 지켜지고 있음. 유지만 하면 됨.

---

## 2. 버튼 (Button) — 역할 = 색

색은 "예쁨"이 아니라 **행동의 우선순위**로 정한다.

| 역할 | 예시 | 클래스 |
|---|---|---|
| **1순위 (전환)** | 결제하기, 장바구니 담기, 컬렉션 보기 | `rounded-full bg-coral px-6 py-3 text-sm font-medium text-white hover:opacity-90` |
| **2순위 (보조 행동)** | 문의하기, 주소 추가, Contact | `rounded-full bg-ink px-6 py-3 text-sm font-medium text-white hover:opacity-80` |
| **3순위 (텍스트 링크)** | 뒤로, 취소, 더보기 | `text-sm text-ink-muted hover:text-ink transition-colors` (배경 없음) |

- **한 화면의 1순위 버튼은 하나** — coral은 "지금 할 가장 중요한 행동"에만.
- 모든 버튼은 `rounded-full`(알약형). 탭 영역 최소 높이 확보(`py-3` ≈ 44px) — 모바일 우선.

### 고칠 곳 (현황)
- `checkout/CheckoutForm.tsx` 결제 버튼 `bg-ink` → **`bg-coral`** (사이트 최종 전환 = 1순위)
- `qa/page.tsx` 문의 버튼 → 2순위면 `bg-ink` 유지 OK (페이지 주행동이면 coral 고려)

---

## 3. 모서리 (Corner Radius) — 요소별 고정

| 요소 | 라운드 |
|---|---|
| 버튼 · 배지(pill) | `rounded-full` |
| 카드 · 박스 · 이미지 컨테이너 | `rounded-xl` |
| 입력창 · textarea · select | `rounded-lg` |
| 구분선/리스트 행 | 라운드 없음 |

> 현재 `lg`/`xl`/`full` 혼재 → 위 기준으로 통일. (예: 계정·Q&A 박스의 `rounded-lg` 카드 → `rounded-xl`)

---

## 4. 한글 줄바꿈 (break-keep) — 헤딩 필수

한글/일본어는 기본적으로 글자 단위로 줄바꿈돼 **단어가 깨진다**(예: "특별하/게"). 방지:

- **모든 `h1`·`h2`·`h3` 및 짧고 큰 카피에 `break-keep` 추가** (word-break: keep-all → 어절 단위 줄바꿈)
- **긴 본문 문단에는 쓰지 말 것** — 어절이 길면 한쪽이 휑하게 빈다.

> 현재 `break-keep`은 4개 파일에만(About·Hero·상품상세·ProductGrid). **나머지 전 페이지 헤딩에 추가 필요.**

---

## 5. 컨테이너 여백 (Layout Container) — 페이지 유형별 프리셋

| 유형 | 래퍼 클래스 |
|---|---|
| 일반 콘텐츠 (장바구니·계정·Q&A·반품·FAQ) | `max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16` |
| 상품 그리드 (products·collections·search) | `max-w-7xl mx-auto px-0 sm:px-6 py-10` |
| 좁은 확인 화면 (checkout success/fail) | `max-w-lg mx-auto px-4 py-16 sm:py-24` |
| 풀블리드 브랜드 섹션 (home·about) | `w-full` + 내부 `max-w-* mx-auto` |

> `py-10`/`py-16`/`py-24` 즉흥 혼용 → 위 프리셋으로 통일.

---

## 6. 섹션 라벨 (Eyebrow Label) — 작은 강조 제목

About에서 정립한 패턴. 섹션 도입부 작은 라벨에 사용:

```
font-display text-xs tracking-[0.3em] uppercase font-semibold text-coral
```
- 글자는 빨강(coral) 허용 — **짧은 대문자 라벨**에 한함(본문 빨강 ❌, 에러로 읽힘).
- 가중치는 `font-semibold`(600). `font-bold`(700)는 자간과 겹쳐 뭉툭.

---

## 7. 스크롤 등장 (Reveal) — 적용 범위 규칙

`components/ui/Reveal.tsx` — **"읽는 콘텐츠"엔 쓰고 "고르는 콘텐츠"엔 쓰지 않는다.**

| 적용 | 미적용 |
|---|---|
| 브랜드 스토리(About), 인스타 피드, 홈 카피 섹션 | 상품 그리드·카테고리·검색결과, 장바구니, 체크아웃 |

> 이유: 쇼핑객은 상품을 즉시 보고 싶어 함. 페이드는 빠른 스크롤 시 빈 화면을 만들어 구매 흐름을 끊음(모바일 1원칙 위배).

---

## 8. 입력 폼 (Form) — 공유 스타일 권장

현재 `CheckoutForm`·`ReturnForm`·`AddressForm`이 각자 `inputCls`를 따로 정의 → 미묘하게 갈라짐.
- 권장: 공통 입력 클래스를 한 곳(예: `lib/utils/ui.ts` 상수 또는 작은 `<Input>` 컴포넌트)으로 추출.
- 표준 입력: `rounded-lg border border-line px-4 py-3 text-sm focus:outline-none focus:border-ink`

---

## 적용 체크리스트 (나중에 일괄 적용 시)

페이지별로 위 규칙 대비 점검:

- [ ] cart — break-keep, 컨테이너 여백
- [ ] checkout — 결제버튼 coral, break-keep, 입력폼 공유화
- [ ] checkout/success·fail — break-keep, 라운드(xl)
- [ ] account (home/orders/orders[id]/addresses…) — break-keep, 카드 라운드 xl, 여백 통일
- [ ] qa (list/detail/new) — break-keep, 배지 스타일 통일, 버튼 역할 확인
- [ ] returns — break-keep, 입력폼 공유화
- [ ] faq — break-keep, 여백, 아코디언 스타일 점검
- [ ] products / collections / search — 그리드 컨테이너 여백 통일 (Reveal 미적용 유지)

> 우선순위: **#4 break-keep(위험0, 즉효) → #2 버튼색 → #5 여백 → #3 라운드 → #8 폼 공유화**
