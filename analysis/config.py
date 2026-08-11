"""
applebuttercollege — 상품 기획 데이터 분석 툴킷 설정.

모든 설정은 환경변수 또는 아래 상수로 관리한다. 서드파티 의존성 없음(표준 라이브러리만).
값이 헷갈리면 analysis/README.md 와 docs/product-planning-data-framework.md 를 참조.
"""
from __future__ import annotations

import os
from pathlib import Path

# ---------------------------------------------------------------------------
# 경로
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("ABC_DATA_DIR", ROOT / "data"))       # 정규화된 입력 CSV
SAMPLE_DIR = ROOT / "sample_data"                                    # 데모용 합성 데이터
OUTPUT_DIR = Path(os.environ.get("ABC_OUTPUT_DIR", ROOT / "output")) # 리포트/표 출력

# ---------------------------------------------------------------------------
# 분석 파라미터 (의사결정 기준값 — 프레임워크 문서와 일치시킬 것)
# ---------------------------------------------------------------------------
# 최근/직전 비교 창(일). recent = 최근 RECENT_DAYS, prior = 그 직전 RECENT_DAYS.
RECENT_DAYS = int(os.environ.get("ABC_RECENT_DAYS", "90"))

# "성장 중" 판정 임계 (직전 창 대비 매출 증가율)
GROWTH_HOT = float(os.environ.get("ABC_GROWTH_HOT", "0.20"))   # +20% 이상 = 상승
GROWTH_COLD = float(os.environ.get("ABC_GROWTH_COLD", "-0.20"))  # -20% 이하 = 하락

# 재입고/확장 후보 상위 N, 신규 기회 상위 N
TOP_RESTOCK = int(os.environ.get("ABC_TOP_RESTOCK", "8"))
TOP_NEW = int(os.environ.get("ABC_TOP_NEW", "6"))

# 재입고·확장 점수 가중치 (합이 1일 필요는 없음 — 상대 비교용)
W_REVENUE = 0.35   # 최근 매출 규모
W_GROWTH = 0.25    # 성장 모멘텀
W_STOCKOUT = 0.20  # 품절/재고소진 신호 (수요>공급)
W_RESONANCE = 0.20 # Meta 콘텐츠 반응 (수요 신호)

# 신규 기회 점수 가중치 (수요-공급 격차 탐지)
W_DEMAND = 0.50      # Meta 반응 + 카테고리 성장
W_SUPPLY_GAP = 0.50  # 현재 카탈로그 커버리지가 얇을수록 높음

# 사이즈 정렬 기준 (없는 값은 뒤로)
SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL"]

# ---------------------------------------------------------------------------
# 외부 API 자격증명 (커넥터 실행 시에만 필요 — 분석 엔진은 CSV만 있으면 동작)
# ---------------------------------------------------------------------------
# MakeShop Open API
MAKESHOP_API_BASE = os.environ.get("MAKESHOP_API_BASE", "https://openapi.makeshop.co.kr")
MAKESHOP_API_KEY = os.environ.get("MAKESHOP_API_KEY", "")   # 상점별 발급 키(오픈API 메뉴)
MAKESHOP_SHOP_ID = os.environ.get("MAKESHOP_SHOP_ID", "")

# Meta Graph API (인스타그램 인사이트) — 스토어프론트와 동일 env 이름 재사용
META_GRAPH_VERSION = os.environ.get("META_GRAPH_VERSION", "v19.0")
INSTAGRAM_ACCESS_TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_USER_ID = os.environ.get("INSTAGRAM_USER_ID", "")

# Meta Marketing API (광고 성과 — 선택. 토큰/권한 별도)
META_MARKETING_TOKEN = os.environ.get("META_MARKETING_TOKEN", "")
META_AD_ACCOUNT_ID = os.environ.get("META_AD_ACCOUNT_ID", "")  # act_ 접두 없이 숫자만


def krw(n: float) -> str:
    """원화 표기. 프로젝트 규칙상 통화 스타일 Intl 대신 접미사 방식."""
    return f"{round(n):,}원"


def pct(x: float, digits: int = 1) -> str:
    return f"{x * 100:.{digits}f}%"
