<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — applebuttercollege 스토어프론트

> 이 파일은 AI 코딩 에이전트를 위한 운영 매뉴얼입니다.
> 상세 도메인 규칙·디자인 시스템·비즈니스 룰은 `CLAUDE.md`를 함께 참조하세요.

## 명령어 (Commands)

| 목적 | 명령어 |
|---|---|
| 개발 서버 | `npm run dev` |
| 프로덕션 빌드 (검증용) | `npm run build` |
| 린트 | `npm run lint` |
| 타입 체크 | `npx tsc --noEmit` |

**작업 완료 전 반드시 `npx tsc --noEmit`로 타입 통과를 확인할 것.**
(이 프로젝트는 아직 자동화 테스트가 없으므로, 타입 체크 + 빌드가 1차 안전망입니다.)

## 기술 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 (`@theme`, config 파일 없음) ·
Shopify Storefront/Admin API · Supabase (Q&A·반품) · Toss Payments

## 디렉토리 (핵심)

```
app/[lang]/(store)/   — 스토어 페이지 (lang: ko | ja | en)
app/admin/            — 관리자 (Q&A 답변, 반품 처리)
app/api/              — OIDC 인증, Toss 웹훅
components/           — layout · home · product · checkout · returns
lib/shopify/          — client · storefront · admin · queries
lib/actions/          — 서버 액션 (cart · order · returns · qa)
lib/utils/format.ts   — formatPrice 등
docs/                 — 체크리스트 · 의사결정 기록(decisions/)
```

## 절대 규칙 (어기면 빌드/정책이 깨짐)

- `tailwind.config` 파일을 만들지 말 것 — v4는 `globals.css`의 `@theme`로 관리
- 가격 표시에 `Intl.NumberFormat` currency 스타일 금지 — `formatPrice()` 사용
- Admin API 호출은 `lib/shopify/admin.ts`의 `adminGql()`만 사용 (`storefront.ts`에 직접 작성 금지)
- `getProductById`에 locale 인자 필수 (Shopify 다국어 컨텍스트)
- 배송비 상수는 `CheckoutForm.tsx`에서만 관리
- 서버 컴포넌트에 불필요한 `'use client'` 추가 금지
- 타입을 우회하려 `as any` 사용 금지 — 설치된 버전의 타입/문서를 확인

## 작업 규칙

- 배포(push)는 사용자 확인 후에만 — 임의 배포 금지
- main 브랜치에서 직접 작업하지 말고 브랜치를 먼저 생성
- 커밋 메시지는 `feat:` / `fix:` / `refactor:` 등 접두어 사용

## 코드 스타일

- 주변 코드의 컨벤션(주석 밀도, 네이밍, 관용구)을 따를 것
- 파일/심볼 참조는 `path:line` 형식으로 (클릭 가능)
