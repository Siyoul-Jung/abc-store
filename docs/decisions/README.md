# 의사결정 기록 (Architecture Decision Records)

> 이 폴더는 프로젝트에서 내린 주요 기술 결정과 **그 이유**, 검토했던 **대안**을 기록합니다.
> 에이전트는 매 세션 백지에서 시작하므로, 여기에 "왜 이렇게 했는지"를 남겨 맥락을 잇습니다.
> (Harness engineering 4요소 중 ④ 지식 저장소)

## 작성 형식

각 결정은 `NNN-제목.md` 파일로:
- **결정**: 무엇을 정했나
- **배경**: 어떤 문제/상황이었나
- **대안**: 검토했지만 채택하지 않은 것
- **이유**: 왜 이걸 골랐나
- **트레이드오프**: 감수한 단점

## 기록된 결정

- [001 — 헤드리스 Shopify 아키텍처](001-headless-shopify.md)
- [002 — Storefront API vs Admin API 분리](002-storefront-vs-admin-api.md)
- [003 — Supabase를 Q&A·반품 저장소로](003-supabase-for-qa-returns.md)
