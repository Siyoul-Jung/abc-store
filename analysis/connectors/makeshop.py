"""
MakeShop Open API 커넥터 — 주문/상품을 정규화 스키마로 수집.

두 가지 경로를 제공한다. 상황에 맞게 선택:

  (A) API 수집     fetch_all(data_dir)      ← .env 에 MAKESHOP_API_KEY 필요
  (B) 엑셀 변환    from_admin_export(...)   ← MakeShop 관리자 '주문 엑셀다운로드' 사용 (API 불필요, 가장 확실)

────────────────────────────────────────────────────────────────────────
⚠️  중요: MakeShop Open API 의 함수명·필드명·응답(XML/JSON) 구조는 상점/버전마다
    다르고 공식 문서가 로그인 뒤에 있습니다. 아래 ENDPOINTS 와 *_FIELD_MAP 은
    공개된 함수명(GetChangedProductOrderList 등)을 토대로 한 '초안'이며,
    실제 연동 시 오픈API 콘솔의 응답을 보고 반드시 맞춰야 합니다(# VERIFY 표시).
    맞추기 애매하면 경로 (B) 엑셀 변환이 가장 안전합니다.
────────────────────────────────────────────────────────────────────────
"""
from __future__ import annotations

import csv
import json
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import config as C
from schema import OrderLine, Product, write_rows

# --- (A) API 계약 (# VERIFY: 오픈API 콘솔 응답과 대조) ----------------------
ENDPOINTS = {
    # 함수명 → 경로. 실제 스펙에 맞게 수정.
    "orders": "/GetChangedProductOrderList",   # VERIFY
    "products": "/GetProductList",             # VERIFY
}

# 응답 필드(왼쪽) → 정규화 필드(오른쪽). 실제 응답 태그명으로 교체.
ORDER_FIELD_MAP = {          # VERIFY
    "ordernum": "order_id",
    "orderdate": "order_date",
    "productcode": "product_id",
    "productname": "product_name",
    "category": "category",
    "optionsize": "option_size",
    "optioncolor": "option_color",
    "ea": "quantity",
    "price": "unit_price",
    "memberid": "customer_id",
}
PRODUCT_FIELD_MAP = {        # VERIFY
    "productcode": "product_id",
    "productname": "product_name",
    "category": "category",
    "regdate": "launch_date",
    "price": "list_price",
    "sellprice": "sale_price",
    "soldout": "status",
}


def _http(path: str, params: dict) -> str:
    params = {**params, "key": C.MAKESHOP_API_KEY}
    url = f"{C.MAKESHOP_API_BASE}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/xml, application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def _parse_records(payload: str) -> list[dict]:
    """XML 또는 JSON 응답을 dict 리스트로. 구조가 다르면 여기만 손보면 됨."""
    payload = payload.strip()
    if payload.startswith("{") or payload.startswith("["):
        data = json.loads(payload)
        if isinstance(data, dict):
            for k in ("data", "list", "orders", "products", "result"):
                if isinstance(data.get(k), list):
                    return data[k]
            return [data]
        return data
    # XML: 반복되는 leaf 컨테이너를 레코드로 간주 (# VERIFY: 실제 태그 구조)
    root = ET.fromstring(payload)
    records = []
    for node in root.iter():
        children = list(node)
        if children and all(len(list(c)) == 0 for c in children):
            records.append({c.tag.lower(): (c.text or "").strip() for c in children})
    return records


def _remap(rec: dict, field_map: dict) -> dict:
    low = {k.lower(): v for k, v in rec.items()}
    return {dst: low.get(src, "") for src, dst in field_map.items()}


def fetch_orders(data_dir: Path) -> int:
    raw = _http(ENDPOINTS["orders"], {"startdate": "20240101"})  # VERIFY 파라미터명
    rows = []
    for rec in _parse_records(raw):
        m = _remap(rec, ORDER_FIELD_MAP)
        qty = int(float(m.get("quantity") or 0))
        price = float(m.get("unit_price") or 0)
        rows.append(OrderLine(
            order_id=m.get("order_id", ""),
            order_date=(m.get("order_date", "") or "")[:10],
            product_id=m.get("product_id", ""),
            product_name=m.get("product_name", ""),
            category=m.get("category", ""),
            option_size=m.get("option_size", ""),
            option_color=m.get("option_color", ""),
            quantity=qty,
            unit_price=price,
            line_revenue=qty * price,
            customer_id=m.get("customer_id", ""),
        ))
    write_rows(Path(data_dir) / "orders.csv", OrderLine, rows)
    return len(rows)


def fetch_products(data_dir: Path) -> int:
    raw = _http(ENDPOINTS["products"], {})
    rows = []
    for rec in _parse_records(raw):
        m = _remap(rec, PRODUCT_FIELD_MAP)
        rows.append(Product(
            product_id=m.get("product_id", ""),
            product_name=m.get("product_name", ""),
            category=m.get("category", ""),
            launch_date=(m.get("launch_date", "") or "")[:10],
            list_price=float(m.get("list_price") or 0),
            sale_price=float(m.get("sale_price") or 0),
            status="soldout" if str(m.get("status")).strip() in ("1", "Y", "true") else "active",
        ))
    write_rows(Path(data_dir) / "products.csv", Product, rows)
    return len(rows)


def fetch_all(data_dir: Path) -> None:
    if not C.MAKESHOP_API_KEY:
        print("    [makeshop] MAKESHOP_API_KEY 없음 → 건너뜀 "
              "(엑셀 경로는 from_admin_export() 사용)")
        return
    try:
        n = fetch_orders(data_dir)
        print(f"    [makeshop] orders.csv ← {n} lines")
    except Exception as e:
        print(f"    [makeshop] 주문 수집 실패: {e}\n"
              f"    → ENDPOINTS/ORDER_FIELD_MAP 를 오픈API 콘솔 응답에 맞춰 수정하거나 "
              f"엑셀 경로(from_admin_export) 사용")
    try:
        n = fetch_products(data_dir)
        print(f"    [makeshop] products.csv ← {n} products")
    except Exception as e:
        print(f"    [makeshop] 상품 수집 실패: {e}")


# --- (B) 관리자 엑셀 export → 정규화 CSV (API 불필요, 권장) -----------------
# MakeShop 관리자 주문 엑셀의 한글 헤더 예시 → 정규화 필드. 실제 헤더에 맞게 조정.
EXPORT_HEADER_MAP = {
    "주문번호": "order_id",
    "주문일자": "order_date",
    "주문일": "order_date",
    "상품코드": "product_id",
    "상품명": "product_name",
    "분류": "category",
    "카테고리": "category",
    "옵션": "option_raw",       # "색상=네이비/사이즈=M" 형태 → 아래서 분해
    "사이즈": "option_size",
    "색상": "option_color",
    "수량": "quantity",
    "판매가": "unit_price",
    "상품구매금액": "line_revenue",
    "주문자ID": "customer_id",
    "아이디": "customer_id",
}


def _split_option(raw: str) -> tuple[str, str]:
    """'색상=네이비/사이즈=M' 또는 '네이비/M' 을 (size, color) 로 최선 분해."""
    size = color = ""
    if not raw:
        return size, color
    parts = [p.strip() for p in raw.replace(",", "/").split("/") if p.strip()]
    for p in parts:
        if "=" in p:
            k, v = [x.strip() for x in p.split("=", 1)]
            if any(s in k for s in ("사이즈", "size", "Size")):
                size = v
            elif any(s in k for s in ("색", "color", "Color")):
                color = v
        else:
            if p.upper() in C.SIZE_ORDER or p.isdigit():
                size = p
            else:
                color = color or p
    return size, color


def from_admin_export(export_csv: Path, data_dir: Path) -> int:
    """MakeShop 관리자에서 받은 주문 엑셀(→CSV 저장)을 정규화 orders.csv 로 변환."""
    export_csv, data_dir = Path(export_csv), Path(data_dir)
    rows = []
    with open(export_csv, newline="", encoding="utf-8-sig") as f:
        for rec in csv.DictReader(f):
            m = {}
            for h, v in rec.items():
                key = EXPORT_HEADER_MAP.get((h or "").strip())
                if key:
                    m[key] = (v or "").strip()
            size, color = m.get("option_size", ""), m.get("option_color", "")
            if not size and not color:
                size, color = _split_option(m.get("option_raw", ""))
            qty = int(float(m.get("quantity") or 0))
            price = float((m.get("unit_price") or "0").replace(",", "") or 0)
            rev = m.get("line_revenue")
            rev = float(rev.replace(",", "")) if rev else qty * price
            rows.append(OrderLine(
                order_id=m.get("order_id", ""),
                order_date=(m.get("order_date", "") or "")[:10].replace(".", "-").replace("/", "-"),
                product_id=m.get("product_id", ""),
                product_name=m.get("product_name", ""),
                category=m.get("category", ""),
                option_size=size, option_color=color,
                quantity=qty, unit_price=price, line_revenue=rev,
                customer_id=m.get("customer_id", ""),
            ))
    write_rows(data_dir / "orders.csv", OrderLine, rows)
    return len(rows)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:  # python makeshop.py <export.csv>  → 엑셀 변환
        n = from_admin_export(sys.argv[1], C.DATA_DIR)
        print(f"[makeshop] 엑셀 변환 완료: orders.csv ← {n} lines")
    else:
        fetch_all(C.DATA_DIR)
