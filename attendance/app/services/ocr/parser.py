"""OCR 원문에서 보드에 표시된 날짜/시간을 뽑아낸다.

이 모듈이 시스템의 심장이다. 여기서 읽어낸 시각이 곧 공식 출퇴근 기록이 되므로,
새로운 보드 표기 포맷이 발견되면 tests/test_parser.py 에 케이스를 먼저 추가한 뒤 여기를 고친다.
"""

from __future__ import annotations

import calendar
import datetime as dt
import re
from dataclasses import dataclass

# 신뢰도 기준값 — 정보가 많이 담긴 포맷일수록 높다
CONF_FULL_DATE = 0.95  # 연·월·일·시각이 모두 있음
CONF_NO_YEAR = 0.80  # 연도 없음 → 수신 시각 기준으로 추론
CONF_TIME_ONLY = 0.50  # 날짜 전체 없음 → 수신 날짜 기준으로 추론

_MONTHS = {name.lower(): i for i, name in enumerate(calendar.month_abbr) if name}
_MONTHS.update({name.lower(): i for i, name in enumerate(calendar.month_name) if name})

# 시:분[:초] [AM|PM]
_TIME = r"(?P<hour>\d{1,2})\s*[:：.]\s*(?P<minute>\d{2})(?:\s*[:：.]\s*(?P<second>\d{2}))?\s*(?P<ampm>[APap]\.?\s?[Mm]\.?)?"

_SEP = r"[\s,·|]*"

# OCR 이 숫자를 알파벳으로 잘못 읽는 대표 사례
_DIGIT_FIXES = str.maketrans({"O": "0", "o": "0", "D": "0", "l": "1", "I": "1", "i": "1", "|": "1", "S": "5", "s": "5", "B": "8", "Z": "2", "z": "2"})


@dataclass(frozen=True)
class ParsedTimestamp:
    """파싱 결과. local_dt 는 로컬 타임존 기준 naive datetime."""

    local_dt: dt.datetime
    confidence: float
    matched_text: str
    pattern: str
    assumed_year: bool = False
    assumed_date: bool = False


def _fix_digits(text: str) -> str:
    """숫자가 섞인 토큰에 한해 O→0, l→1 같은 오인식을 교정한다.

    영문 단어(예: 'Stock')까지 망가뜨리지 않도록 '숫자를 최소 1개 포함한 덩어리'에만 적용.
    """

    def repl(match: re.Match[str]) -> str:
        token = match.group(0)
        if not any(ch.isdigit() for ch in token):
            return token
        return token.translate(_DIGIT_FIXES)

    return re.sub(r"[0-9OoDlIi|SsBZz]{2,}", repl, text)


def _normalize(text: str) -> str:
    """한국어 표기와 공백/구두점을 영문 기준으로 통일한다."""
    out = text.replace(" ", " ")
    # 2026년 8월 14일 → 2026-8-14
    out = re.sub(r"(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일", r"\1-\2-\3", out)
    # 8월 14일 → 8/14  (연도 없는 표기)
    out = re.sub(r"(\d{1,2})\s*월\s*(\d{1,2})\s*일", r"\1/\2", out)
    # 오전/오후 6:02 → 6:02 AM/PM  (한국어는 시각 앞에 오므로 뒤로 옮긴다)
    out = re.sub(r"오전\s*(\d{1,2}\s*[:：.]\s*\d{2}(?:\s*[:：.]\s*\d{2})?)", r"\1 AM", out)
    out = re.sub(r"오후\s*(\d{1,2}\s*[:：.]\s*\d{2}(?:\s*[:：.]\s*\d{2})?)", r"\1 PM", out)
    return re.sub(r"[ \t]+", " ", out)


def _apply_meridiem(hour: int, ampm: str | None) -> int | None:
    if ampm is None:
        return hour if 0 <= hour <= 23 else None
    marker = ampm.replace(".", "").replace(" ", "").upper()
    if hour < 1 or hour > 12:
        return None
    if marker == "AM":
        return 0 if hour == 12 else hour
    return 12 if hour == 12 else hour + 12


def _time_parts(match: re.Match[str]) -> tuple[int, int, int] | None:
    hour = _apply_meridiem(int(match.group("hour")), match.group("ampm"))
    minute = int(match.group("minute"))
    second = int(match.group("second") or 0)
    if hour is None or minute > 59 or second > 59:
        return None
    return hour, minute, second


def _resolve_month_day(a: int, b: int, date_order: str) -> tuple[int, int] | None:
    """(a, b) 를 (month, day) 로 해석. 한쪽이 12 를 넘으면 순서 설정보다 우선한다."""
    if a > 12 and b <= 12:
        month, day = b, a
    elif b > 12 and a <= 12:
        month, day = a, b
    elif date_order == "DMY":
        month, day = b, a
    else:
        month, day = a, b
    if not (1 <= month <= 12 and 1 <= day <= 31):
        return None
    return month, day


def _build(year: int, month: int, day: int, hms: tuple[int, int, int]) -> dt.datetime | None:
    try:
        return dt.datetime(year, month, day, *hms)
    except ValueError:
        return None


def _closest_year(month: int, day: int, hms: tuple[int, int, int], reference: dt.datetime) -> dt.datetime | None:
    """연도가 빠진 경우 수신 시각에 가장 가까운 해를 고른다(연말·연초 경계 대응)."""
    candidates = []
    for year in (reference.year - 1, reference.year, reference.year + 1):
        built = _build(year, month, day, hms)
        if built is not None:
            candidates.append(built)
    if not candidates:
        return None
    return min(candidates, key=lambda d: abs((d - reference).total_seconds()))


def _closest_date(hms: tuple[int, int, int], reference: dt.datetime) -> dt.datetime:
    """시각만 있는 경우 수신 시각에 가장 가까운 날짜를 고른다(자정 전후 대응)."""
    base = reference.date()
    candidates = [
        dt.datetime.combine(base + dt.timedelta(days=offset), dt.time(*hms))
        for offset in (-1, 0, 1)
    ]
    return min(candidates, key=lambda d: abs((d - reference).total_seconds()))


def _iter_patterns(date_order: str):
    """(이름, 정규식, 빌더) 목록. 앞쪽이 더 구체적인 포맷."""

    def numeric_full(m: re.Match[str], reference: dt.datetime) -> ParsedTimestamp | None:
        hms = _time_parts(m)
        if hms is None:
            return None
        g1, g2, g3 = m.group("d1"), m.group("d2"), m.group("d3")
        if len(g1) == 4:  # 2026-08-14
            year, md = int(g1), _resolve_month_day(int(g2), int(g3), "MDY")
        else:
            year_raw = int(g3)
            year = year_raw if len(g3) == 4 else 2000 + year_raw
            md = _resolve_month_day(int(g1), int(g2), date_order)
        if md is None:
            return None
        built = _build(year, md[0], md[1], hms)
        if built is None:
            return None
        return ParsedTimestamp(built, CONF_FULL_DATE, m.group(0).strip(), "numeric_full")

    def month_name(m: re.Match[str], reference: dt.datetime) -> ParsedTimestamp | None:
        hms = _time_parts(m)
        if hms is None:
            return None
        month = _MONTHS.get(m.group("mon").lower())
        if month is None:
            return None
        day = int(m.group("day"))
        year_raw = m.group("year")
        if year_raw:
            built = _build(int(year_raw), month, day, hms)
            conf, assumed = CONF_FULL_DATE, False
        else:
            built = _closest_year(month, day, hms, reference)
            conf, assumed = CONF_NO_YEAR, True
        if built is None:
            return None
        return ParsedTimestamp(built, conf, m.group(0).strip(), "month_name", assumed_year=assumed)

    def numeric_no_year(m: re.Match[str], reference: dt.datetime) -> ParsedTimestamp | None:
        hms = _time_parts(m)
        if hms is None:
            return None
        md = _resolve_month_day(int(m.group("d1")), int(m.group("d2")), date_order)
        if md is None:
            return None
        built = _closest_year(md[0], md[1], hms, reference)
        if built is None:
            return None
        return ParsedTimestamp(
            built, CONF_NO_YEAR, m.group(0).strip(), "numeric_no_year", assumed_year=True
        )

    def time_only(m: re.Match[str], reference: dt.datetime) -> ParsedTimestamp | None:
        hms = _time_parts(m)
        if hms is None:
            return None
        return ParsedTimestamp(
            _closest_date(hms, reference),
            CONF_TIME_ONLY,
            m.group(0).strip(),
            "time_only",
            assumed_year=True,
            assumed_date=True,
        )

    return [
        (
            "numeric_full",
            re.compile(rf"(?P<d1>\d{{1,4}})[/\-.](?P<d2>\d{{1,2}})[/\-.](?P<d3>\d{{2,4}}){_SEP}{_TIME}"),
            numeric_full,
        ),
        (
            "month_name",
            re.compile(
                rf"(?P<mon>[A-Za-z]{{3,9}})\.?\s+(?P<day>\d{{1,2}})(?:st|nd|rd|th)?,?\s*(?P<year>\d{{4}})?{_SEP}{_TIME}"
            ),
            month_name,
        ),
        (
            "numeric_no_year",
            re.compile(rf"(?P<d1>\d{{1,2}})[/\-.](?P<d2>\d{{1,2}}){_SEP}{_TIME}"),
            numeric_no_year,
        ),
        ("time_only", re.compile(_TIME), time_only),
    ]


def parse_board_datetime(
    text: str,
    reference_local: dt.datetime,
    date_order: str = "MDY",
) -> ParsedTimestamp | None:
    """OCR 원문에서 날짜/시간을 추출한다.

    Args:
        text: OCR 원문
        reference_local: 연·월·일이 빠졌을 때 기준으로 삼을 로컬 시각 (보통 메시지 수신 시각)
        date_order: 'MDY' 또는 'DMY' — 8/9/2026 처럼 모호한 표기를 해석하는 순서

    Returns:
        가장 구체적인 포맷으로 매칭된 결과. 하나도 못 찾으면 None.
    """
    if not text:
        return None

    variants = [_normalize(text)]
    fixed = _fix_digits(variants[0])
    if fixed != variants[0]:
        variants.append(fixed)

    for name, regex, build in _iter_patterns(date_order.upper()):
        for index, variant in enumerate(variants):
            for match in regex.finditer(variant):
                parsed = build(match, reference_local)
                if parsed is None:
                    continue
                if index > 0:  # 문자→숫자 교정을 거친 결과는 살짝 낮게 본다
                    parsed = ParsedTimestamp(
                        parsed.local_dt,
                        round(parsed.confidence * 0.9, 4),
                        parsed.matched_text,
                        f"{parsed.pattern}+fixed",
                        parsed.assumed_year,
                        parsed.assumed_date,
                    )
                return parsed
    return None
