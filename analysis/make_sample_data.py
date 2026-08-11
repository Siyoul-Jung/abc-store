#!/usr/bin/env python3
"""
합성(가짜) 샘플 데이터 생성 — 아동복 브랜드를 흉내낸 결정적(seed 고정) 데이터.

목적:
  - 자격증명 없이도 분석 파이프라인이 처음부터 끝까지 도는 걸 증명.
  - 사장님이 '실제로 어떤 리포트가 나오는지' 미리 눈으로 확인.
실제 운영에서는 이 파일 대신 커넥터(--fetch) 또는 관리자 엑셀 변환으로 data/ 를 채운다.

생성물(sample_data/): orders.csv, products.csv, inventory.csv,
                      instagram_media.csv, audience.csv
"""
from __future__ import annotations

import random
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

import config as C
from schema import (OrderLine, Product, InventoryRow, MediaInsight, AudienceRow,
                    write_rows)

random.seed(42)
ASOF = date(2026, 8, 10)
START = ASOF - timedelta(days=545)  # ~18개월

# id, 이름, 카테고리, 정가, 판매가, 출시(개월 전), 기본인기, 최근부스트, 사이즈, 최근품절
PRODUCTS = [
    ("P101", "데일리 베이직 티셔츠", "상의", 19000, 15900, 17, 1.9, 1.0, ["XS", "S", "M", "L", "XL"], False),
    ("P102", "프릴 카라 블라우스", "상의", 32000, 32000, 16, 1.2, 1.6, ["S", "M", "L", "XL"], True),
    ("P103", "스트라이프 긴팔티", "상의", 24000, 21000, 12, 1.0, 1.0, ["XS", "S", "M", "L"], False),
    ("P104", "고밀도 맨투맨", "상의", 34000, 29000, 9, 1.1, 1.3, ["S", "M", "L", "XL", "2XL"], False),
    ("P105", "루즈핏 니트", "상의", 39000, 39000, 6, 0.8, 1.1, ["S", "M", "L"], False),
    ("P201", "코튼 조거 팬츠", "하의", 29000, 24000, 15, 1.4, 1.2, ["XS", "S", "M", "L", "XL"], False),
    ("P202", "데님 오버올", "하의", 46000, 39000, 11, 0.9, 1.0, ["S", "M", "L"], False),
    ("P203", "레깅스 2종세트", "하의", 22000, 18000, 8, 1.0, 1.4, ["XS", "S", "M", "L"], True),
    ("P301", "경량 패딩 베스트", "아우터", 59000, 52000, 14, 1.0, 1.0, ["S", "M", "L", "XL"], False),
    ("P302", "후드 집업 점퍼", "아우터", 54000, 48000, 10, 1.1, 1.2, ["S", "M", "L", "XL"], False),
    ("P401", "플라워 원피스", "원피스", 42000, 36000, 13, 1.2, 1.5, ["S", "M", "L"], True),
    ("P402", "린넨 셔츠 원피스", "원피스", 47000, 47000, 7, 0.9, 1.3, ["S", "M", "L"], False),
    ("P501", "상하 세트 (티+팬츠)", "세트", 49000, 42000, 12, 1.3, 1.2, ["S", "M", "L", "XL"], False),
    ("P502", "잠옷 세트", "세트", 33000, 28000, 9, 1.0, 1.1, ["XS", "S", "M", "L"], False),
    ("P601", "코튼 헤어밴드", "악세서리", 12000, 9900, 5, 0.5, 2.2, ["S", "M"], True),
    ("P602", "니트 비니", "악세서리", 16000, 13000, 4, 0.4, 2.0, ["S", "M", "L"], False),
]

COLORS = ["아이보리", "네이비", "코랄", "그레이", "카키"]

# 카테고리별 월 계절가중 (1=1월 … 12=12월)
SEASON = {
    "상의": [0.8, 0.8, 1.0, 1.1, 1.2, 1.2, 1.1, 1.1, 1.0, 1.0, 0.9, 0.9],
    "하의": [0.9, 0.9, 1.0, 1.1, 1.1, 1.0, 1.0, 1.0, 1.1, 1.1, 1.0, 0.9],
    "아우터": [1.6, 1.4, 0.8, 0.5, 0.3, 0.2, 0.2, 0.3, 0.6, 1.1, 1.6, 1.8],
    "원피스": [0.5, 0.6, 0.9, 1.2, 1.5, 1.7, 1.6, 1.4, 1.0, 0.7, 0.5, 0.4],
    "세트": [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.1, 1.1],
    "악세서리": [1.1, 1.0, 0.9, 0.9, 0.9, 0.9, 1.0, 1.0, 1.0, 1.1, 1.2, 1.3],
}


def trend(recent_boost: float, d: date) -> float:
    """최근 90일 구간에서 recent_boost 로 선형 상승."""
    days_ago = (ASOF - d).days
    if days_ago <= C.RECENT_DAYS:
        f = 1 - days_ago / C.RECENT_DAYS  # 0→1 최근일수록 큼
        return 1 + (recent_boost - 1) * f
    return 1.0


def main():
    # 현실적 재구매율(~25%)을 위해 대다수는 1회 구매, 소수 충성고객이 반복 구매
    customers = [f"C{n:05d}" for n in range(1, 5200)]
    loyal = customers[:600]
    def pick_customer():
        return random.choice(loyal) if random.random() < 0.25 else random.choice(customers)

    orders_by_key = defaultdict(list)  # (customer, day) -> [line dict]
    products_out, inventory_out = [], []

    for (pid, name, cat, listp, sale, launch_m, base, boost, sizes, soldout) in PRODUCTS:
        launch = ASOF - timedelta(days=int(launch_m * 30.4))
        products_out.append(Product(
            product_id=pid, product_name=name, category=cat,
            launch_date=launch.isoformat(), list_price=listp, sale_price=sale,
            status="soldout" if soldout else "active",
            available_sizes="|".join(sizes),
        ))
        # 최근 품절 상품: 큰 사이즈 일부 재고0
        if soldout:
            for sz in sizes[-2:]:
                inventory_out.append(InventoryRow(pid, sz, "", 0))

        d = max(START, launch)
        while d <= ASOF:
            mult = SEASON[cat][d.month - 1] * trend(boost, d)
            lam = base * 0.9 * mult  # 하루 기대 판매 강도
            units = 0
            # 간단한 포아송 근사
            p = 2.718281828 ** (-lam)
            k, cum = 0, p
            r = random.random()
            while r > cum and k < 12:
                k += 1
                p *= lam / k
                cum += p
            units = k
            for _ in range(units):
                # 최근 90일 품절 상품은 큰 사이즈 판매 중단(품절 신호 생성)
                pool = sizes
                if soldout and (ASOF - d).days <= C.RECENT_DAYS:
                    pool = sizes[:-2] or sizes
                sz = random.choice(pool)
                color = random.choice(COLORS)
                cust = pick_customer()
                orders_by_key[(cust, d)].append({
                    "pid": pid, "name": name, "cat": cat, "sz": sz,
                    "color": color, "price": sale,
                })
            d += timedelta(days=1)

    # (customer, day) → 주문 1건, 그 안에 라인 여러 개
    orders_out = []
    for i, ((cust, day), lines) in enumerate(sorted(orders_by_key.items(), key=lambda x: x[0][1]), 1):
        oid = f"O{day.strftime('%y%m%d')}{i:05d}"
        # 라인 병합 (같은 상품/사이즈/색은 수량 합산)
        merged = defaultdict(int)
        meta = {}
        for ln in lines:
            key = (ln["pid"], ln["sz"], ln["color"])
            merged[key] += 1
            meta[key] = ln
        for (pid, sz, color), qty in merged.items():
            ln = meta[(pid, sz, color)]
            orders_out.append(OrderLine(
                order_id=oid, order_date=day.isoformat(),
                product_id=pid, product_name=ln["name"], category=ln["cat"],
                option_size=sz, option_color=color, quantity=qty,
                unit_price=ln["price"], line_revenue=qty * ln["price"],
                customer_id=cust, channel="web",
            ))

    # 인스타 게시물 (최근 12개월, 상품 태그 + 해시태그)
    media_out = []
    posts = [
        ("P601", "여름 데일리룩 #헤어밴드 #아동복 #키즈코디", 4200, 520, 1.0),
        ("P602", "가을 니트 비니 #비니 #키즈패션 #데일리룩", 3800, 410, 0.95),
        ("P102", "프릴 블라우스 신상 #블라우스 #키즈룩", 5100, 260, 0.7),
        ("P401", "플라워 원피스 #원피스 #여름코디 #키즈", 6200, 640, 0.9),
        ("P203", "레깅스 2종 #레깅스 #데일리 #실용템", 3300, 180, 0.55),
        ("P101", "베이직 티셔츠 재입고 #베이직 #키즈아이템", 2900, 120, 0.5),
        ("P104", "맨투맨 코디 #맨투맨 #가을코디", 3100, 150, 0.5),
        ("P501", "상하세트 추천 #세트 #선물추천", 3600, 300, 0.65),
        ("P601", "헤어밴드 컬러 5종 #헤어밴드 #포인트템", 4800, 610, 1.05),
        ("P402", "린넨 원피스 #린넨 #여름원피스", 2700, 140, 0.5),
    ]
    base_day = ASOF - timedelta(days=300)
    for i, (pid, cap, reach, inter, save_ratio) in enumerate(posts):
        ts = (base_day + timedelta(days=i * 28)).isoformat() + "T10:00:00+0000"
        media_out.append(MediaInsight(
            media_id=f"IGM{i:03d}", timestamp=ts, caption=f"{cap} [{pid}]",
            media_type="IMAGE", permalink=f"https://instagram.com/p/{i:03d}",
            reach=reach, saved=int(inter * save_ratio * 0.6),
            likes=int(inter * 0.8), comments=int(inter * 0.1),
            shares=int(inter * 0.1), total_interactions=inter,
            product_ids=pid,
        ))

    # 팔로워 오디언스
    audience_out = [
        AudienceRow("age", "25-34", 42), AudienceRow("age", "35-44", 33),
        AudienceRow("age", "18-24", 14), AudienceRow("age", "45-54", 9),
        AudienceRow("gender", "F", 88), AudienceRow("gender", "M", 12),
        AudienceRow("city", "Seoul", 41), AudienceRow("city", "Gyeonggi", 27),
        AudienceRow("city", "Busan", 8), AudienceRow("city", "Incheon", 6),
        AudienceRow("country", "KR", 92), AudienceRow("country", "JP", 5),
    ]

    d = C.SAMPLE_DIR
    write_rows(d / "orders.csv", OrderLine, orders_out)
    write_rows(d / "products.csv", Product, products_out)
    write_rows(d / "inventory.csv", InventoryRow, inventory_out)
    write_rows(d / "instagram_media.csv", MediaInsight, media_out)
    write_rows(d / "audience.csv", AudienceRow, audience_out)
    print(f"orders {len(orders_out)} · products {len(products_out)} · "
          f"inventory {len(inventory_out)} · media {len(media_out)} · audience {len(audience_out)}")
    print(f"→ {d}")


if __name__ == "__main__":
    main()
