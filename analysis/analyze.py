"""
분석 엔진 — 정규화 Dataset을 받아 상품 기획 의사결정용 표(table)들을 만든다.

설계 원칙:
- 모든 점수는 '왜 이 점수인가'가 표에 그대로 드러나도록 구성요소를 함께 반환한다
  (블랙박스 금지 — 사장님이 근거를 보고 판단해야 함).
- '지금' 기준은 데이터의 마지막 주문일(asof)로 잡는다. 그래서 과거 데이터로도
  결정적으로(deterministic) 재현된다.
"""
from __future__ import annotations

import re
from collections import defaultdict, Counter
from datetime import date, timedelta
from typing import Iterable

import config as C
from schema import Dataset


# --- 공통 유틸 -------------------------------------------------------------

def _d(s: str):
    try:
        return date.fromisoformat((s or "")[:10])
    except ValueError:
        return None


def asof_date(ds: Dataset):
    dates = [d for d in (_d(o.order_date) for o in ds.orders) if d]
    return max(dates) if dates else date.today()


def _norm(values: dict) -> dict:
    """min-max 정규화 0..1. 값이 모두 같으면 0.5, 비면 {}."""
    if not values:
        return {}
    lo, hi = min(values.values()), max(values.values())
    if hi == lo:
        return {k: 0.5 for k in values}
    return {k: (v - lo) / (hi - lo) for k, v in values.items()}


def _size_key(sz: str):
    order = {s: i for i, s in enumerate(C.SIZE_ORDER)}
    if sz in order:
        return (0, order[sz])
    # 숫자 사이즈(90/100/110…)면 숫자순
    m = re.match(r"^\d+", sz or "")
    if m:
        return (1, int(m.group()))
    return (2, sz)


# --- 1. 상품 모멘텀 (재입고/확장 근간) --------------------------------------

def product_momentum(ds: Dataset):
    asof = asof_date(ds)
    r0 = asof - timedelta(days=C.RECENT_DAYS)
    r1 = asof - timedelta(days=2 * C.RECENT_DAYS)
    pidx = ds.product_index

    recent_rev = defaultdict(float)
    prior_rev = defaultdict(float)
    recent_units = defaultdict(int)
    life_rev = defaultdict(float)
    life_units = defaultdict(int)
    last_sale = {}
    name = {}
    cat = {}

    for o in ds.orders:
        od = _d(o.order_date)
        if not od:
            continue
        pid = o.product_id
        name.setdefault(pid, o.product_name or (pidx.get(pid).product_name if pid in pidx else pid))
        cat.setdefault(pid, o.category or (pidx.get(pid).category if pid in pidx else ""))
        life_rev[pid] += o.line_revenue
        life_units[pid] += o.quantity
        if not last_sale.get(pid) or od > last_sale[pid]:
            last_sale[pid] = od
        if r0 < od <= asof:
            recent_rev[pid] += o.line_revenue
            recent_units[pid] += o.quantity
        elif r1 < od <= r0:
            prior_rev[pid] += o.line_revenue

    rows = []
    for pid in life_rev:
        pr = prior_rev.get(pid, 0.0)
        rc = recent_rev.get(pid, 0.0)
        if pr > 0:
            growth = (rc - pr) / pr
            new_flag = ""
        elif rc > 0:
            growth = 1.0
            new_flag = "신규상승"
        else:
            growth = -1.0
            new_flag = ""
        rows.append({
            "product_id": pid,
            "product_name": name.get(pid, pid),
            "category": cat.get(pid, ""),
            "recent_rev": round(rc),
            "prior_rev": round(pr),
            "growth": growth,
            "recent_units": recent_units.get(pid, 0),
            "lifetime_rev": round(life_rev[pid]),
            "lifetime_units": life_units[pid],
            "last_sale": last_sale.get(pid).isoformat() if last_sale.get(pid) else "",
            "flag": new_flag,
        })
    rows.sort(key=lambda x: x["recent_rev"], reverse=True)
    return rows


# --- 2. 카테고리 성과 -------------------------------------------------------

def category_performance(ds: Dataset):
    asof = asof_date(ds)
    r0 = asof - timedelta(days=C.RECENT_DAYS)
    r1 = asof - timedelta(days=2 * C.RECENT_DAYS)

    recent = defaultdict(float)
    prior = defaultdict(float)
    life = defaultdict(float)
    skus = defaultdict(set)
    for o in ds.orders:
        od = _d(o.order_date)
        c = o.category or "(미분류)"
        life[c] += o.line_revenue
        skus[c].add(o.product_id)
        if od and r0 < od <= asof:
            recent[c] += o.line_revenue
        elif od and r1 < od <= r0:
            prior[c] += o.line_revenue

    total_recent = sum(recent.values()) or 1.0
    rows = []
    for c in life:
        pr, rc = prior.get(c, 0.0), recent.get(c, 0.0)
        growth = (rc - pr) / pr if pr > 0 else (1.0 if rc > 0 else -1.0)
        rows.append({
            "category": c,
            "recent_rev": round(rc),
            "recent_share": rc / total_recent,
            "growth": growth,
            "sku_count": len(skus[c]),
            "rev_per_sku": round(rc / max(1, len(skus[c]))),
            "lifetime_rev": round(life[c]),
        })
    rows.sort(key=lambda x: x["recent_rev"], reverse=True)
    return rows


# --- 3. 사이즈 분포 + 품절 신호 --------------------------------------------

def size_distribution(ds: Dataset):
    by_size = defaultdict(int)
    by_cat_size = defaultdict(lambda: defaultdict(int))
    for o in ds.orders:
        if not o.option_size:
            continue
        by_size[o.option_size] += o.quantity
        by_cat_size[o.category or "(미분류)"][o.option_size] += o.quantity
    total = sum(by_size.values()) or 1
    rows = [{"option_size": s, "units": u, "share": u / total}
            for s, u in by_size.items()]
    rows.sort(key=lambda x: _size_key(x["option_size"]))
    return rows


def stockout_signal(ds: Dataset):
    """
    품절/재고소진 신호 = 수요>공급. 세 가지 근거를 합친다.
      (a) products.status 가 soldout/discontinued 인데 최근 판매 이력 있음
      (b) inventory.csv 에서 판매이력 있는 옵션의 current_stock == 0
      (c) 직전 창엔 팔렸는데 최근 창엔 0인 사이즈(다른 사이즈는 계속 팔리는 상품)
    상품별 stockout_score 0..1 = 소진 신호가 잡힌 옵션 비율(+status 가산).
    """
    asof = asof_date(ds)
    r0 = asof - timedelta(days=C.RECENT_DAYS)
    r1 = asof - timedelta(days=2 * C.RECENT_DAYS)
    pidx = ds.product_index

    sold_sizes = defaultdict(set)      # pid -> 전체 판매된 사이즈
    prior_sz = defaultdict(set)
    recent_sz = defaultdict(set)
    recent_any = set()
    name = {}
    for o in ds.orders:
        od = _d(o.order_date)
        name.setdefault(o.product_id, o.product_name)
        if o.option_size:
            sold_sizes[o.product_id].add(o.option_size)
            if od and r0 < od <= asof:
                recent_sz[o.product_id].add(o.option_size)
            elif od and r1 < od <= r0:
                prior_sz[o.product_id].add(o.option_size)
        if od and r0 < od <= asof:
            recent_any.add(o.product_id)

    zero_stock = defaultdict(set)      # pid -> 재고0 옵션
    for iv in ds.inventory:
        if iv.current_stock == 0 and iv.option_size:
            zero_stock[iv.product_id].add(iv.option_size)

    rows = []
    for pid, sizes in sold_sizes.items():
        reasons = []
        gone = set()
        # (c) 직전엔 팔렸는데 최근 사라진 사이즈 (상품 자체는 최근에도 팔림)
        if pid in recent_any:
            faded = prior_sz[pid] - recent_sz[pid]
            if faded and recent_sz[pid]:
                gone |= faded
                reasons.append(f"최근 판매중단 사이즈 {sorted(faded, key=_size_key)}")
        # (b) 재고0
        if zero_stock.get(pid):
            g = zero_stock[pid] & sizes
            if g:
                gone |= g
                reasons.append(f"재고0 {sorted(g, key=_size_key)}")
        # (a) status
        st = pidx.get(pid).status if pid in pidx else "active"
        status_bonus = 0.3 if st in ("soldout", "discontinued") and pid in recent_any else 0.0
        if status_bonus:
            reasons.append(f"상태={st}")
        base = (len(gone) / len(sizes)) if sizes else 0.0
        score = min(1.0, base + status_bonus)
        if score > 0:
            rows.append({
                "product_id": pid,
                "product_name": name.get(pid, pid),
                "stockout_score": round(score, 3),
                "signals": " · ".join(reasons),
            })
    rows.sort(key=lambda x: x["stockout_score"], reverse=True)
    return rows


# --- 4. 가격대 분석 --------------------------------------------------------

def price_bands(ds: Dataset):
    bands = [(0, 20000), (20000, 30000), (30000, 40000),
             (40000, 60000), (60000, 90000), (90000, 10**9)]

    def label(lo, hi):
        return f"{lo//1000}k~{'' if hi > 10**8 else str(hi//1000)+'k'}".replace("~", "+" if hi > 10**8 else "~")

    rev = defaultdict(float)
    units = defaultdict(int)
    orders = defaultdict(set)
    for o in ds.orders:
        p = o.unit_price
        for lo, hi in bands:
            if lo <= p < hi:
                key = label(lo, hi)
                rev[key] += o.line_revenue
                units[key] += o.quantity
                orders[key].add(o.order_id)
                break
    total = sum(rev.values()) or 1.0
    rows = []
    for lo, hi in bands:
        key = label(lo, hi)
        rows.append({
            "price_band": key,
            "revenue": round(rev.get(key, 0)),
            "rev_share": rev.get(key, 0) / total,
            "units": units.get(key, 0),
            "orders": len(orders.get(key, set())),
        })
    return rows


# --- 5. 재구매 + 히어로 상품 ------------------------------------------------

def repeat_and_hero(ds: Dataset):
    cust_orders = defaultdict(set)
    cust_products = defaultdict(set)
    prod_customers = defaultdict(set)
    prod_repeat_customers = defaultdict(set)
    name = {}
    for o in ds.orders:
        if not o.customer_id:
            continue
        cust_orders[o.customer_id].add(o.order_id)
        cust_products[o.customer_id].add(o.product_id)
        prod_customers[o.product_id].add(o.customer_id)
        name.setdefault(o.product_id, o.product_name)

    repeat_custs = {c for c, os in cust_orders.items() if len(os) >= 2}
    total_custs = len(cust_orders) or 1
    repeat_rate = len(repeat_custs) / total_custs

    for o in ds.orders:
        if o.customer_id in repeat_custs:
            prod_repeat_customers[o.product_id].add(o.customer_id)

    hero = []
    for pid, custs in prod_customers.items():
        rc = len(prod_repeat_customers.get(pid, set()))
        hero.append({
            "product_id": pid,
            "product_name": name.get(pid, pid),
            "buyers": len(custs),
            "repeat_buyers": rc,
            "repeat_buyer_share": rc / len(custs) if custs else 0,
        })
    hero.sort(key=lambda x: (x["repeat_buyer_share"], x["buyers"]), reverse=True)

    # 함께 구매(장바구니 연관) 상위 페어
    pair = Counter()
    order_products = defaultdict(set)
    for o in ds.orders:
        order_products[o.order_id].add((o.product_id, o.product_name))
    for prods in order_products.values():
        items = sorted(prods)
        for i in range(len(items)):
            for j in range(i + 1, len(items)):
                pair[(items[i][1], items[j][1])] += 1
    pairs = [{"pair": f"{a}  +  {b}", "co_orders": n}
             for (a, b), n in pair.most_common(10) if n >= 2]

    return {"repeat_rate": repeat_rate, "hero": hero, "pairs": pairs}


# --- 6. 계절성 -------------------------------------------------------------

def seasonality(ds: Dataset):
    by_month_cat = defaultdict(lambda: defaultdict(float))
    cats = set()
    for o in ds.orders:
        od = _d(o.order_date)
        if not od:
            continue
        ym = f"{od.year:04d}-{od.month:02d}"
        c = o.category or "(미분류)"
        by_month_cat[ym][c] += o.line_revenue
        cats.add(c)
    months = sorted(by_month_cat)
    cats = sorted(cats)
    rows = []
    for ym in months:
        row = {"month": ym, "total": round(sum(by_month_cat[ym].values()))}
        for c in cats:
            row[c] = round(by_month_cat[ym].get(c, 0))
        rows.append(row)
    return {"months": rows, "categories": cats}


# --- 7. Meta 콘텐츠 반응 ----------------------------------------------------

_HASHTAG = re.compile(r"#([0-9A-Za-z_가-힣]+)")


def meta_resonance(ds: Dataset):
    posts = []
    prod_res = defaultdict(list)   # pid -> engagement rates (reach 가중)
    cat_res = defaultdict(list)
    theme = defaultdict(lambda: {"reach": 0, "inter": 0, "posts": 0})
    pidx = ds.product_index

    for m in ds.media:
        reach = m.reach or 0
        er = (m.total_interactions / reach) if reach else 0.0
        sr = (m.saved / reach) if reach else 0.0
        posts.append({
            "media_id": m.media_id,
            "timestamp": (m.timestamp or "")[:10],
            "reach": reach,
            "saved": m.saved,
            "engagement_rate": er,
            "save_rate": sr,
            "caption": (m.caption or "")[:40].replace("\n", " "),
            "permalink": m.permalink,
        })
        for pid in [x for x in m.product_ids.split("|") if x]:
            prod_res[pid].append((er, reach))
            c = pidx.get(pid).category if pid in pidx else ""
            if c:
                cat_res[c].append((er, reach))
        for tag in set(_HASHTAG.findall(m.caption or "")):
            t = theme[tag]
            t["reach"] += reach
            t["inter"] += m.total_interactions
            t["posts"] += 1

    posts.sort(key=lambda x: x["engagement_rate"], reverse=True)

    def wavg(pairs):
        wsum = sum(w for _, w in pairs)
        return (sum(er * w for er, w in pairs) / wsum) if wsum else 0.0

    product_resonance = {pid: wavg(v) for pid, v in prod_res.items()}
    category_resonance = {c: wavg(v) for c, v in cat_res.items()}

    themes = [{"theme": f"#{t}", "posts": d["posts"], "reach": d["reach"],
               "engagement_rate": (d["inter"] / d["reach"]) if d["reach"] else 0.0}
              for t, d in theme.items() if d["posts"] >= 1]
    themes.sort(key=lambda x: x["engagement_rate"], reverse=True)

    return {
        "posts": posts,
        "product_resonance": product_resonance,
        "category_resonance": category_resonance,
        "themes": themes,
    }


# --- 8. 오디언스 -----------------------------------------------------------

def audience_summary(ds: Dataset):
    by_dim = defaultdict(list)
    for a in ds.audience:
        by_dim[a.dimension].append((a.bucket, a.value))
    out = {}
    for dim, items in by_dim.items():
        total = sum(v for _, v in items) or 1.0
        rows = [{"bucket": b, "value": v, "share": v / total}
                for b, v in sorted(items, key=lambda x: x[1], reverse=True)]
        out[dim] = rows
    return out


# --- 9. 교차분석: 재입고/확장 후보 ------------------------------------------

def restock_candidates(ds: Dataset, momentum=None, stockout=None, meta=None):
    momentum = momentum or product_momentum(ds)
    stockout = stockout or stockout_signal(ds)
    meta = meta or meta_resonance(ds)
    stock_by = {r["product_id"]: r for r in stockout}
    res_by = meta["product_resonance"]

    # 최근 매출 상위권만 후보로 (꼬리 노이즈 제거)
    pool = [m for m in momentum if m["recent_rev"] > 0][: max(20, C.TOP_RESTOCK * 3)]
    rev_n = _norm({m["product_id"]: m["recent_rev"] for m in pool})
    grow_n = _norm({m["product_id"]: max(-1.0, min(2.0, m["growth"])) for m in pool})
    res_n = _norm({pid: res_by.get(pid, 0.0) for pid in [m["product_id"] for m in pool]})

    rows = []
    for m in pool:
        pid = m["product_id"]
        so = stock_by.get(pid, {}).get("stockout_score", 0.0)
        score = 100 * (
            C.W_REVENUE * rev_n.get(pid, 0)
            + C.W_GROWTH * grow_n.get(pid, 0)
            + C.W_STOCKOUT * so
            + C.W_RESONANCE * res_n.get(pid, 0)
        )
        why = []
        if grow_n.get(pid, 0) > 0.6:
            why.append(f"성장 {C.pct(m['growth'])}")
        if so > 0:
            why.append(f"품절신호 {so:.2f}")
        if res_n.get(pid, 0) > 0.6:
            why.append("인스타 반응 높음")
        if rev_n.get(pid, 0) > 0.6:
            why.append("최근 매출 상위")
        rows.append({
            "product_id": pid,
            "product_name": m["product_name"],
            "category": m["category"],
            "score": round(score, 1),
            "recent_rev": m["recent_rev"],
            "growth": m["growth"],
            "stockout": round(so, 2),
            "resonance_rank": round(res_n.get(pid, 0), 2),
            "why": ", ".join(why) or "안정적 매출",
        })
    rows.sort(key=lambda x: x["score"], reverse=True)
    return rows[: C.TOP_RESTOCK]


# --- 10. 교차분석: 신규 상품 기회 (수요-공급 격차) --------------------------

def new_opportunities(ds: Dataset, catperf=None, meta=None):
    catperf = catperf or category_performance(ds)
    meta = meta or meta_resonance(ds)
    cat_res = meta["category_resonance"]

    growth_n = _norm({c["category"]: max(-1.0, min(2.0, c["growth"])) for c in catperf})
    res_n = _norm({c["category"]: cat_res.get(c["category"], 0.0) for c in catperf})
    sku_n = _norm({c["category"]: c["sku_count"] for c in catperf})
    share_n = _norm({c["category"]: c["recent_share"] for c in catperf})

    rows = []
    for c in catperf:
        cat = c["category"]
        demand = 0.5 * growth_n.get(cat, 0) + 0.5 * res_n.get(cat, 0)
        # 공급 격차: SKU 적고(수요 대비 얇음) 매출비중 낮은데 수요 신호는 있음
        supply_gap = 0.6 * (1 - sku_n.get(cat, 0)) + 0.4 * (1 - share_n.get(cat, 0))
        score = 100 * (C.W_DEMAND * demand + C.W_SUPPLY_GAP * supply_gap)
        why = []
        if growth_n.get(cat, 0) > 0.6:
            why.append(f"카테고리 성장 {C.pct(c['growth'])}")
        if res_n.get(cat, 0) > 0.6:
            why.append("인스타 반응 강함")
        if sku_n.get(cat, 0) < 0.4:
            why.append(f"SKU {c['sku_count']}개(얇음)")
        rows.append({
            "category": cat,
            "score": round(score, 1),
            "sku_count": c["sku_count"],
            "recent_share": c["recent_share"],
            "growth": c["growth"],
            "resonance_rank": round(res_n.get(cat, 0), 2),
            "why": ", ".join(why) or "커버리지 대비 수요 여력",
        })
    rows.sort(key=lambda x: x["score"], reverse=True)

    # 카탈로그에 약한 '테마' 기회 (반응 높은 해시태그 상위)
    themes = [t for t in meta["themes"] if t["reach"] > 0][:8]
    return {"categories": rows[: C.TOP_NEW], "themes": themes}
