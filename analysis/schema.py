"""
정규화 데이터 계약(schema).

이 계층이 '데이터 출처'와 '분석 엔진'을 분리한다.
- 커넥터(makeshop.py / meta.py)는 이 CSV 포맷으로 '쓰기'만 한다.
- 엔진(analyze.py)은 이 CSV 포맷을 '읽기'만 한다.
- 그래서 MakeShop API가 XML이든, 관리자 엑셀 export든, 나중에 Shopify로 바뀌든
  이 스키마만 맞추면 분석 로직은 그대로 재사용된다.

파일 (모두 UTF-8 CSV, 헤더 포함):
  orders.csv            주문 라인아이템 (분석의 근간 — 필수)
  products.csv          상품 카탈로그 (권장)
  inventory.csv         옵션별 재고 (선택 — 품절 신호 정밀화)
  instagram_media.csv   인스타 게시물 인사이트 (선택 — 수요 신호)
  audience.csv          팔로워 인구통계 (선택 — 타깃 파악)
"""
from __future__ import annotations

import csv
from dataclasses import dataclass, fields, asdict
from pathlib import Path
from typing import Optional


# --- 필드 정의 (문자열 헤더 = 정확히 이 이름을 써야 함) ----------------------

@dataclass
class OrderLine:
    order_id: str
    order_date: str          # YYYY-MM-DD
    product_id: str
    product_name: str = ""
    category: str = ""
    option_size: str = ""
    option_color: str = ""
    quantity: int = 0
    unit_price: float = 0.0  # 실제 결제 단가(원)
    line_revenue: float = 0.0
    customer_id: str = ""    # 익명 식별자면 충분 (재구매 분석용)
    channel: str = ""


@dataclass
class Product:
    product_id: str
    product_name: str = ""
    category: str = ""
    launch_date: str = ""    # YYYY-MM-DD
    list_price: float = 0.0
    sale_price: float = 0.0
    status: str = "active"   # active | soldout | discontinued
    available_sizes: str = ""  # 파이프 구분: "XS|S|M|L"


@dataclass
class InventoryRow:
    product_id: str
    option_size: str = ""
    option_color: str = ""
    current_stock: int = 0


@dataclass
class MediaInsight:
    media_id: str
    timestamp: str = ""      # ISO
    caption: str = ""
    media_type: str = ""
    permalink: str = ""
    reach: int = 0
    saved: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    total_interactions: int = 0
    product_ids: str = ""    # 파이프 구분 — 게시물↔상품 매핑 (캡션 파싱/수동)


@dataclass
class AudienceRow:
    dimension: str           # age | gender | city | country
    bucket: str              # "25-34" | "F" | "Seoul" ...
    value: float = 0.0       # 인원 또는 비율


# --- 범용 CSV I/O ----------------------------------------------------------

_INT_HINTS = {"quantity", "reach", "saved", "likes", "comments", "shares",
              "total_interactions", "current_stock"}
_FLOAT_HINTS = {"unit_price", "line_revenue", "list_price", "sale_price", "value"}


def _coerce(cls, row: dict):
    kwargs = {}
    valid = {f.name for f in fields(cls)}
    for k, v in row.items():
        if k not in valid:
            continue
        v = (v or "").strip()
        if k in _INT_HINTS:
            kwargs[k] = int(float(v)) if v else 0
        elif k in _FLOAT_HINTS:
            kwargs[k] = float(v) if v else 0.0
        else:
            kwargs[k] = v
    return cls(**kwargs)


def read_rows(path: Path, cls) -> list:
    if not Path(path).exists():
        return []
    with open(path, newline="", encoding="utf-8-sig") as f:
        return [_coerce(cls, r) for r in csv.DictReader(f)]


def write_rows(path: Path, cls, rows: list) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    header = [f.name for f in fields(cls)]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=header)
        w.writeheader()
        for r in rows:
            w.writerow(asdict(r) if not isinstance(r, dict) else r)


# --- 데이터셋 번들 ---------------------------------------------------------

@dataclass
class Dataset:
    orders: list
    products: list
    inventory: list
    media: list
    audience: list

    @property
    def product_index(self) -> dict:
        return {p.product_id: p for p in self.products}


def load_dataset(data_dir: Path) -> Dataset:
    d = Path(data_dir)
    return Dataset(
        orders=read_rows(d / "orders.csv", OrderLine),
        products=read_rows(d / "products.csv", Product),
        inventory=read_rows(d / "inventory.csv", InventoryRow),
        media=read_rows(d / "instagram_media.csv", MediaInsight),
        audience=read_rows(d / "audience.csv", AudienceRow),
    )
