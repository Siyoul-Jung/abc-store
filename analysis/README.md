# analysis — 상품 기획 데이터 분석 툴킷

MakeShop(실판매) + Meta(수요·오디언스 신호) 데이터를 엮어 **"뭘 다시 만들까(재입고·확장)"**와
**"뭘 새로 만들까(신규 기회)"**를 데이터로 답하는 파이프라인.

- **의존성 없음** — Python 3.9+ 표준 라이브러리만. pip/venv 불필요.
- **자격증명 없이도 동작** — 분석 엔진은 CSV만 있으면 돈다. 키는 `--fetch`(API 수집) 때만 필요.
- **재현 가능** — '지금' 기준을 데이터의 마지막 주문일로 잡아 결정적으로 재현.

전략·산식 배경은 **`docs/product-planning-data-framework.md`** 참조.

---

## 빠른 시작

```bash
cd analysis

# 1) 데모: 합성 데이터로 리포트가 어떻게 나오는지 즉시 확인
python3 make_sample_data.py
python3 run.py --sample
#   → output/product-planning-report.md  (커밋된 예시: EXAMPLE_REPORT.md)

# 2) 실데이터: 아래 셋 중 하나로 data/ 를 채우고 실행
python3 run.py            # data/ 의 정규화 CSV 로 분석
```

## 실데이터 넣는 3가지 방법

| 방법 | 명령 | 필요한 것 |
|---|---|---|
| **A. 관리자 엑셀(권장·가장 확실)** | `python3 connectors/makeshop.py 주문export.csv` → `python3 run.py` | MakeShop 관리자에서 주문 엑셀 다운로드 후 CSV 저장. API 불필요 |
| **B. API 자동 수집** | `cp .env.example .env` (값 채우기) → `python3 run.py --fetch` | MakeShop Open API 키 + Instagram 토큰 |
| **C. 직접 작성** | `schema.py` 포맷대로 `data/orders.csv` 등 작성 → `python3 run.py` | 스키마만 맞추면 출처 무관 |

> ⚠️ **방법 B(MakeShop API)**: 오픈API 함수명·필드 구조는 상점/버전마다 달라
> `connectors/makeshop.py` 상단의 `ENDPOINTS` / `*_FIELD_MAP`(# VERIFY 표시)을
> 오픈API 콘솔 응답에 맞춰 조정해야 합니다. 애매하면 방법 A가 안전합니다.

## 입력 데이터 스키마 (`schema.py`)

정규화 계층이 출처와 분석을 분리한다. 필요한 파일만 있으면 되고, 없으면 해당 분석만 생략된다.

| 파일 | 필수 | 내용 |
|---|---|---|
| `orders.csv` | ✅ | 주문 라인아이템 (분석의 근간) |
| `products.csv` | 권장 | 상품 카탈로그 (카테고리·가격·상태·출시일) |
| `inventory.csv` | 선택 | 옵션별 재고 — 품절 신호 정밀화 |
| `instagram_media.csv` | 선택 | 인스타 게시물 인사이트 — 수요 신호 |
| `audience.csv` | 선택 | 팔로워 인구통계 — 타깃 파악 |

`orders.csv` 컬럼: `order_id, order_date(YYYY-MM-DD), product_id, product_name,
category, option_size, option_color, quantity, unit_price, line_revenue, customer_id, channel`

## 출력 (`output/`)

- `product-planning-report.md` — 사람이 읽는 리포트 (의사결정 요약 + 상세 9개 섹션)
- `tables/*.csv` — 각 분석 표의 원본 CSV (엑셀 재가공용)

## 파일 구조

```
analysis/
  run.py                # CLI 오케스트레이터
  config.py             # 파라미터·가중치·자격증명(env)
  schema.py             # 정규화 스키마 + CSV I/O
  analyze.py            # 분석 엔진 (모멘텀/카테고리/사이즈/품절/가격/재구매/계절/Meta/교차)
  report.py             # 마크다운 + CSV 렌더러
  make_sample_data.py   # 합성 데이터 생성기 (데모용)
  connectors/
    makeshop.py         # MakeShop Open API + 관리자 엑셀 변환
    meta.py             # Meta Graph API (IG 인사이트/오디언스, 선택 광고성과)
  sample_data/          # 커밋된 합성 데이터 (out-of-box 실행용)
  EXAMPLE_REPORT.md     # 커밋된 예시 리포트 (sample_data 기준)
```

## 조정 포인트

- 의사결정 임계·점수 가중치: `config.py` (`RECENT_DAYS`, `W_*`, `TOP_*`)
- 가격대 구간: `analyze.py` `price_bands()`
- 사이즈 정렬: `config.py` `SIZE_ORDER`
- 게시물↔상품 매핑: 캡션에 `[P상품코드]` 표기하면 Meta 커넥터가 자동 매핑, 아니면
  `instagram_media.csv` 의 `product_ids` 컬럼 수동 입력
