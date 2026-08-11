"""
리포트 렌더러 — 분석 결과를 마크다운 리포트 + CSV 표로 출력한다.
출력물: output/product-planning-report.md, output/tables/*.csv
"""
from __future__ import annotations

import csv
from pathlib import Path

import config as C
from config import krw, pct
from schema import Dataset
import analyze as A


def _md_table(rows, columns) -> str:
    """columns: [(key, label, fmt)]  fmt: callable(value)->str 또는 None."""
    if not rows:
        return "_데이터 없음_\n"
    head = "| " + " | ".join(label for _, label, _ in columns) + " |"
    sep = "| " + " | ".join("---" for _ in columns) + " |"
    lines = [head, sep]
    for r in rows:
        cells = []
        for key, _, fmt in columns:
            v = r.get(key, "")
            cells.append(fmt(v) if fmt else str(v))
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines) + "\n"


def _write_csv(path: Path, rows):
    if not rows:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    keys = list(rows[0].keys())
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)


def build_report(ds: Dataset, out_dir: Path) -> Path:
    out_dir = Path(out_dir)
    tdir = out_dir / "tables"
    asof = A.asof_date(ds)

    momentum = A.product_momentum(ds)
    catperf = A.category_performance(ds)
    sizes = A.size_distribution(ds)
    stockout = A.stockout_signal(ds)
    bands = A.price_bands(ds)
    repeat = A.repeat_and_hero(ds)
    season = A.seasonality(ds)
    meta = A.meta_resonance(ds)
    audience = A.audience_summary(ds)
    restock = A.restock_candidates(ds, momentum, stockout, meta)
    newop = A.new_opportunities(ds, catperf, meta)

    # CSV 덤프 (재가공용)
    _write_csv(tdir / "product_momentum.csv", momentum)
    _write_csv(tdir / "category_performance.csv", catperf)
    _write_csv(tdir / "size_distribution.csv", sizes)
    _write_csv(tdir / "stockout_signal.csv", stockout)
    _write_csv(tdir / "price_bands.csv", bands)
    _write_csv(tdir / "hero_products.csv", repeat["hero"])
    _write_csv(tdir / "restock_candidates.csv", restock)
    _write_csv(tdir / "new_opportunities.csv", newop["categories"])
    _write_csv(tdir / "meta_posts.csv", meta["posts"])

    has_meta = bool(ds.media)
    n_orders = len({o.order_id for o in ds.orders})
    n_lines = len(ds.orders)
    span = ""
    dts = sorted({o.order_date[:10] for o in ds.orders if o.order_date})
    if dts:
        span = f"{dts[0]} ~ {dts[-1]}"

    P = []
    w = P.append
    w("# applebuttercollege — 상품 기획 데이터 리포트\n")
    w(f"> 분석 기준일(asof): **{asof.isoformat()}** · "
      f"최근/직전 비교 창: **{C.RECENT_DAYS}일**\n")
    w(f"> 데이터: 주문 {n_orders:,}건 / 라인 {n_lines:,}행 · 기간 {span} · "
      f"인스타 인사이트 {'포함' if has_meta else '없음(판매 데이터만)'}\n")
    w("\n> ⚠️ 점수는 상대 비교용 휴리스틱입니다. 근거 컬럼(why/구성요소)을 함께 보고 "
      "최종 판단은 사람이 하세요. 산식은 `docs/product-planning-data-framework.md` 참조.\n")

    # ---- 의사결정 요약 ----
    w("\n---\n\n## 🎯 의사결정 요약\n")
    w("\n### 다시 만들까 — 재입고·확장 우선순위\n")
    w(_md_table(restock, [
        ("product_name", "상품", None),
        ("category", "카테고리", None),
        ("score", "점수", None),
        ("recent_rev", "최근매출", krw),
        ("growth", "성장", pct),
        ("stockout", "품절신호", None),
        ("why", "근거", None),
    ]))
    w("\n### 새로 만들까 — 신규 상품 기회 (수요-공급 격차)\n")
    w(_md_table(newop["categories"], [
        ("category", "카테고리", None),
        ("score", "점수", None),
        ("sku_count", "현재SKU", None),
        ("recent_share", "매출비중", pct),
        ("growth", "성장", pct),
        ("why", "근거", None),
    ]))
    if newop["themes"]:
        w("\n**인스타에서 반응 높은 테마(해시태그)** — 카탈로그 커버리지 점검용:\n")
        w(_md_table(newop["themes"][:8], [
            ("theme", "테마", None),
            ("posts", "게시물", None),
            ("engagement_rate", "인게이지먼트", lambda v: pct(v)),
        ]))

    # ---- 상세 ----
    w("\n---\n\n## 1. 상품 모멘텀 (최근 매출순 상위 15)\n")
    w(_md_table(momentum[:15], [
        ("product_name", "상품", None),
        ("category", "카테고리", None),
        ("recent_rev", "최근매출", krw),
        ("prior_rev", "직전매출", krw),
        ("growth", "성장", pct),
        ("recent_units", "최근수량", None),
        ("flag", "플래그", None),
    ]))

    w("\n## 2. 카테고리 성과\n")
    w(_md_table(catperf, [
        ("category", "카테고리", None),
        ("recent_rev", "최근매출", krw),
        ("recent_share", "비중", pct),
        ("growth", "성장", pct),
        ("sku_count", "SKU수", None),
        ("rev_per_sku", "SKU당매출", krw),
    ]))

    w("\n## 3. 사이즈 분포\n")
    w("어떤 사이즈가 실제로 팔리는지 — 사이즈 레인지 확장/축소 판단.\n\n")
    w(_md_table(sizes, [
        ("option_size", "사이즈", None),
        ("units", "판매수량", None),
        ("share", "비중", pct),
    ]))

    w("\n## 4. 품절·재고소진 신호 (수요>공급)\n")
    w("재입고·사이즈 보강 1순위 후보. 근거 신호를 함께 표기.\n\n")
    w(_md_table(stockout[:12], [
        ("product_name", "상품", None),
        ("stockout_score", "점수", None),
        ("signals", "신호", None),
    ]))

    w("\n## 5. 가격대 분석\n")
    w(_md_table(bands, [
        ("price_band", "가격대", None),
        ("revenue", "매출", krw),
        ("rev_share", "비중", pct),
        ("units", "수량", None),
        ("orders", "주문수", None),
    ]))

    w("\n## 6. 재구매 & 히어로 상품\n")
    w(f"전체 재구매율(2회 이상 구매 고객 비율): **{pct(repeat['repeat_rate'])}**\n\n")
    w("재구매 고객 비중이 높은 상품 = 라인 확장 가치가 큰 '히어로':\n\n")
    w(_md_table(repeat["hero"][:10], [
        ("product_name", "상품", None),
        ("buyers", "구매고객", None),
        ("repeat_buyers", "재구매고객", None),
        ("repeat_buyer_share", "재구매비중", pct),
    ]))
    if repeat["pairs"]:
        w("\n함께 구매된 상품 페어(세트/번들 기획 힌트):\n\n")
        w(_md_table(repeat["pairs"], [
            ("pair", "함께 구매", None),
            ("co_orders", "동시주문수", None),
        ]))

    w("\n## 7. 계절성 (월별 카테고리 매출)\n")
    cats = season["categories"]
    cols = [("month", "월", None), ("total", "합계", krw)]
    cols += [(c, c, krw) for c in cats]
    w(_md_table(season["months"], cols))

    if has_meta:
        w("\n## 8. 인스타그램 콘텐츠 반응 (인게이지먼트 상위 10)\n")
        w("반응 높은 콘텐츠 = 오디언스가 원하는 것. 상품/테마 매핑으로 수요 신호화.\n\n")
        w(_md_table(meta["posts"][:10], [
            ("timestamp", "날짜", None),
            ("reach", "도달", None),
            ("saved", "저장", None),
            ("engagement_rate", "인게이지먼트", lambda v: pct(v)),
            ("save_rate", "저장률", lambda v: pct(v)),
            ("caption", "캡션", None),
        ]))
        if audience:
            w("\n## 9. 팔로워 오디언스\n")
            for dim in ("age", "gender", "city", "country"):
                if dim in audience:
                    w(f"\n**{dim}**\n\n")
                    w(_md_table(audience[dim][:8], [
                        ("bucket", dim, None),
                        ("value", "값", None),
                        ("share", "비중", pct),
                    ]))
    else:
        w("\n## 8. 인스타그램 콘텐츠 반응\n")
        w("_instagram_media.csv 가 없어 생략됨. Meta 커넥터 실행 또는 CSV 배치 시 "
          "수요 신호(반응 높은 콘텐츠·테마)가 추가됩니다._\n")

    w("\n---\n\n### 다음 액션\n")
    w("1. 위 '재입고·확장' 상위 후보 중 **품절신호+성장** 동시 충족 상품부터 발주 검토.\n")
    w("2. '신규 기회' 카테고리 중 **SKU 얇고 성장/반응 높은** 것 1~2개를 다음 드롭 후보로.\n")
    w("3. 반응 높은 테마를 현재 카탈로그와 대조 — 비어있으면 그게 곧 기획 슬롯.\n")
    w("4. 가격대·사이즈 분포에 맞춰 신상품 스펙(정가/사이즈 레인지) 확정.\n")

    out_dir.mkdir(parents=True, exist_ok=True)
    report_path = out_dir / "product-planning-report.md"
    report_path.write_text("".join(P), encoding="utf-8")
    return report_path
