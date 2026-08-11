"""
Meta Graph API 커넥터 — 인스타그램 콘텐츠 인사이트 + 팔로워 인구통계.

정규화 출력:
  instagram_media.csv   (게시물별 reach/saved/인게이지먼트)
  audience.csv          (age/gender/city/country 팔로워 분포)

필요 env: INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID  (스토어프론트와 동일 이름 재사용)
선택 env: META_MARKETING_TOKEN, META_AD_ACCOUNT_ID  (광고 성과 — 있으면 ad_insights.csv 추가)

표준 라이브러리만 사용(urllib). 반응 지표 이름은 Graph API 버전에 따라 바뀌므로
INSIGHT_METRICS 상수에서 조정한다.
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

import config as C
from schema import MediaInsight, AudienceRow, write_rows

GRAPH = f"https://graph.facebook.com/{C.META_GRAPH_VERSION}"

# 게시물 인사이트 지표 (v19 기준. 일부는 계정 유형/버전에 따라 미지원 → 자동 스킵)
INSIGHT_METRICS = ["reach", "saved", "total_interactions", "likes", "comments", "shares"]

# 캡션에서 상품ID를 뽑는 규칙(선택). 예: 캡션에 "[P123]" 표기 → product_ids=P123.
# 표기 규칙이 없으면 빈 값 → 나중에 수동 매핑(instagram_media.csv 의 product_ids 컬럼).
PRODUCT_TAG_RE = re.compile(r"\[P([0-9A-Za-z_-]+)\]")


def _get(url: str, params: dict) -> dict:
    q = urllib.parse.urlencode(params)
    req = urllib.request.Request(f"{url}?{q}", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def _paged(url: str, params: dict, limit_pages: int = 20):
    page = 0
    while url and page < limit_pages:
        data = _get(url, params) if page == 0 else _get(url, {})
        for item in data.get("data", []):
            yield item
        url = data.get("paging", {}).get("next", "")
        params = {}
        page += 1


def fetch_media(token: str, ig_user_id: str) -> list:
    fields = "id,caption,media_type,permalink,timestamp,like_count,comments_count"
    out = []
    for m in _paged(f"{GRAPH}/{ig_user_id}/media",
                    {"fields": fields, "access_token": token, "limit": 50}):
        mid = m.get("id")
        caption = m.get("caption", "") or ""
        ins = {}
        try:
            r = _get(f"{GRAPH}/{mid}/insights",
                     {"metric": ",".join(INSIGHT_METRICS), "access_token": token})
            for row in r.get("data", []):
                vals = row.get("values", [{}])
                ins[row["name"]] = vals[0].get("value", 0) if vals else 0
        except Exception as e:  # 미지원 지표/오류는 0 처리
            print(f"    [meta] insights 스킵 {mid}: {e}")
        pids = "|".join(PRODUCT_TAG_RE.findall(caption))
        out.append(MediaInsight(
            media_id=mid,
            timestamp=m.get("timestamp", ""),
            caption=caption,
            media_type=m.get("media_type", ""),
            permalink=m.get("permalink", ""),
            reach=int(ins.get("reach", 0) or 0),
            saved=int(ins.get("saved", 0) or 0),
            likes=int(ins.get("likes", m.get("like_count", 0)) or 0),
            comments=int(ins.get("comments", m.get("comments_count", 0)) or 0),
            shares=int(ins.get("shares", 0) or 0),
            total_interactions=int(ins.get("total_interactions", 0) or 0),
            product_ids=pids,
        ))
    return out


def fetch_audience(token: str, ig_user_id: str) -> list:
    """
    팔로워 인구통계. 신형 API는 follower_demographics + breakdown(age/gender/city).
    계정/버전에 따라 audience_* (구형)만 되기도 함 → 실패 시 빈 리스트.
    """
    rows = []
    for breakdown, dim in (("age", "age"), ("gender", "gender"), ("city", "city")):
        try:
            r = _get(f"{GRAPH}/{ig_user_id}/insights", {
                "metric": "follower_demographics",
                "period": "lifetime",
                "metric_type": "total_value",
                "breakdown": breakdown,
                "access_token": token,
            })
            for m in r.get("data", []):
                tv = m.get("total_value", {})
                for res in tv.get("breakdowns", [{}])[0].get("results", []):
                    bucket = "/".join(res.get("dimension_values", []))
                    rows.append(AudienceRow(dimension=dim, bucket=bucket,
                                            value=float(res.get("value", 0))))
        except Exception as e:
            print(f"    [meta] audience({dim}) 스킵: {e}")
    return rows


def fetch_ad_insights(token: str, ad_account: str) -> list:
    """선택: 광고 성과. 반환 dict 리스트(정규화 스키마 밖 — 참고용 CSV)."""
    try:
        r = _get(f"{GRAPH}/act_{ad_account}/insights", {
            "fields": "campaign_name,spend,impressions,clicks,ctr,actions,action_values",
            "level": "campaign",
            "date_preset": "last_90d",
            "access_token": token,
        })
        return r.get("data", [])
    except Exception as e:
        print(f"    [meta] ad insights 스킵: {e}")
        return []


def fetch_all(data_dir: Path) -> None:
    token, uid = C.INSTAGRAM_ACCESS_TOKEN, C.INSTAGRAM_USER_ID
    if not token or not uid:
        print("    [meta] INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_USER_ID 없음 → 건너뜀")
        return
    data_dir = Path(data_dir)
    media = fetch_media(token, uid)
    write_rows(data_dir / "instagram_media.csv", MediaInsight, media)
    print(f"    [meta] instagram_media.csv ← {len(media)} posts")

    audience = fetch_audience(token, uid)
    if audience:
        write_rows(data_dir / "audience.csv", AudienceRow, audience)
        print(f"    [meta] audience.csv ← {len(audience)} rows")

    if C.META_MARKETING_TOKEN and C.META_AD_ACCOUNT_ID:
        import csv
        ad = fetch_ad_insights(C.META_MARKETING_TOKEN, C.META_AD_ACCOUNT_ID)
        if ad:
            path = data_dir / "ad_insights.csv"
            with open(path, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=sorted({k for r in ad for k in r}))
                w.writeheader()
                for r in ad:
                    w.writerow({k: json.dumps(v, ensure_ascii=False)
                                if isinstance(v, (list, dict)) else v for k, v in r.items()})
            print(f"    [meta] ad_insights.csv ← {len(ad)} campaigns")


if __name__ == "__main__":
    fetch_all(C.DATA_DIR)
