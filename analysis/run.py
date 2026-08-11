#!/usr/bin/env python3
"""
상품 기획 데이터 분석 — 오케스트레이터(CLI).

사용:
  python run.py                 # data/ 의 정규화 CSV로 분석 → output/ 리포트
  python run.py --sample        # sample_data/ 합성 데이터로 데모 실행
  python run.py --fetch         # 커넥터로 API에서 data/ 로 수집 후 분석
  python run.py --data DIR --out DIR

분석 엔진은 자격증명이 전혀 필요 없다(CSV만 있으면 동작).
--fetch 를 줄 때만 MakeShop/Meta 커넥터가 돌고, 이때 .env 의 키가 필요하다.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import config as C
from schema import load_dataset
from report import build_report


def main(argv=None):
    ap = argparse.ArgumentParser(description="applebuttercollege 상품 기획 데이터 분석")
    ap.add_argument("--sample", action="store_true", help="sample_data/ 로 데모 실행")
    ap.add_argument("--fetch", action="store_true", help="API 커넥터로 먼저 수집")
    ap.add_argument("--data", type=str, default=None, help="정규화 CSV 디렉토리")
    ap.add_argument("--out", type=str, default=None, help="출력 디렉토리")
    args = ap.parse_args(argv)

    data_dir = Path(args.data) if args.data else (C.SAMPLE_DIR if args.sample else C.DATA_DIR)
    out_dir = Path(args.out) if args.out else C.OUTPUT_DIR

    if args.fetch:
        # 지연 import — 수집할 때만 네트워크 코드 로드
        from connectors import makeshop, meta
        print("[fetch] MakeShop 주문/상품 수집…")
        makeshop.fetch_all(data_dir)
        print("[fetch] Meta 인스타 인사이트 수집…")
        meta.fetch_all(data_dir)

    if not (data_dir / "orders.csv").exists():
        print(f"[!] {data_dir}/orders.csv 가 없습니다.\n"
              f"    - 데모: python run.py --sample\n"
              f"    - 수집: python run.py --fetch  (.env 에 키 필요)\n"
              f"    - 수동: MakeShop 관리자에서 주문 엑셀을 orders.csv 스키마로 저장 후 {data_dir}/ 에 배치",
              file=sys.stderr)
        return 1

    ds = load_dataset(data_dir)
    print(f"[load] 주문라인 {len(ds.orders):,} · 상품 {len(ds.products):,} · "
          f"인스타 {len(ds.media):,} · 재고 {len(ds.inventory):,} · 오디언스 {len(ds.audience):,}")
    report = build_report(ds, out_dir)
    print(f"[done] 리포트: {report}")
    print(f"[done] 표(csv): {out_dir / 'tables'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
