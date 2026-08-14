"""보드 시각 파싱 테스트.

새 보드 표기 포맷이 발견되면 여기에 케이스를 먼저 추가하고 parser.py 를 고친다.
"""

from __future__ import annotations

import datetime as dt

import pytest

from app.services.ocr.parser import parse_board_datetime

REFERENCE = dt.datetime(2026, 8, 14, 6, 5)  # 메시지 수신 시각(로컬) 가정


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        # 프롬프트에 제시된 대표 포맷
        ("8/14/2026 6:02 AM", dt.datetime(2026, 8, 14, 6, 2)),
        # 보드 주변 텍스트가 섞여 들어와도 잡아낸다
        ("재고 현황판 08/14/2026 06:02:15 AM 총 128", dt.datetime(2026, 8, 14, 6, 2, 15)),
        ("2026-08-14 06:02", dt.datetime(2026, 8, 14, 6, 2)),
        ("2026.08.14 06:02", dt.datetime(2026, 8, 14, 6, 2)),
        ("2026년 8월 14일 오전 6:02", dt.datetime(2026, 8, 14, 6, 2)),
        ("2026년 8월 14일 오후 6:02", dt.datetime(2026, 8, 14, 18, 2)),
        ("Aug 14, 2026 6:02 AM", dt.datetime(2026, 8, 14, 6, 2)),
        ("August 14 2026 06:02", dt.datetime(2026, 8, 14, 6, 2)),
        # 줄바꿈으로 분리된 경우
        ("8/14/2026\n6:02 AM", dt.datetime(2026, 8, 14, 6, 2)),
        # 두 자리 연도
        ("8/14/26 6:02 AM", dt.datetime(2026, 8, 14, 6, 2)),
    ],
)
def test_full_datetime_formats(text: str, expected: dt.datetime) -> None:
    parsed = parse_board_datetime(text, REFERENCE)
    assert parsed is not None
    assert parsed.local_dt == expected
    assert parsed.confidence >= 0.7


def test_meridiem_midnight_and_noon() -> None:
    assert parse_board_datetime("8/14/2026 12:30 AM", REFERENCE).local_dt == dt.datetime(2026, 8, 14, 0, 30)
    assert parse_board_datetime("8/14/2026 12:30 PM", REFERENCE).local_dt == dt.datetime(2026, 8, 14, 12, 30)


def test_dmy_order_when_configured() -> None:
    """8/9 처럼 모호한 날짜는 DATE_ORDER 설정을 따른다."""
    mdy = parse_board_datetime("8/9/2026 06:02", REFERENCE, date_order="MDY")
    dmy = parse_board_datetime("8/9/2026 06:02", REFERENCE, date_order="DMY")
    assert mdy.local_dt == dt.datetime(2026, 8, 9, 6, 2)
    assert dmy.local_dt == dt.datetime(2026, 9, 8, 6, 2)


def test_unambiguous_day_beats_configured_order() -> None:
    """14 는 월이 될 수 없으므로 MDY 설정이어도 일(day)로 해석한다."""
    parsed = parse_board_datetime("14/08/2026 06:02", REFERENCE, date_order="MDY")
    assert parsed.local_dt == dt.datetime(2026, 8, 14, 6, 2)


def test_missing_year_uses_reference() -> None:
    parsed = parse_board_datetime("8/14 06:02", REFERENCE)
    assert parsed.local_dt == dt.datetime(2026, 8, 14, 6, 2)
    assert parsed.assumed_year is True
    assert parsed.confidence < 0.95


def test_missing_year_across_new_year_boundary() -> None:
    """1월 1일 수신인데 보드가 12/31 이면 전년도로 해석해야 한다."""
    reference = dt.datetime(2027, 1, 1, 0, 20)
    parsed = parse_board_datetime("12/31 23:50", reference)
    assert parsed.local_dt == dt.datetime(2026, 12, 31, 23, 50)


def test_time_only_uses_reference_date() -> None:
    parsed = parse_board_datetime("06:02 AM", REFERENCE)
    assert parsed.local_dt == dt.datetime(2026, 8, 14, 6, 2)
    assert parsed.assumed_date is True
    assert parsed.confidence <= 0.5


def test_time_only_picks_nearest_day_across_midnight() -> None:
    """00:10 수신인데 보드가 23:55 면 전날로 해석해야 한다."""
    reference = dt.datetime(2026, 8, 15, 0, 10)
    parsed = parse_board_datetime("23:55", reference)
    assert parsed.local_dt == dt.datetime(2026, 8, 14, 23, 55)


def test_ocr_letter_digit_confusion_is_repaired() -> None:
    """O→0, l→1, S→5 오인식을 교정해서 읽는다."""
    parsed = parse_board_datetime("8/l4/2O26 O6:O2 AM", REFERENCE)
    assert parsed is not None
    assert parsed.local_dt == dt.datetime(2026, 8, 14, 6, 2)
    assert parsed.pattern.endswith("+fixed")


def test_full_date_preferred_over_bare_time() -> None:
    """숫자 시각이 먼저 나와도, 날짜가 붙은 쪽을 채택한다."""
    parsed = parse_board_datetime("합계 12:30 / 8/14/2026 6:02 AM", REFERENCE)
    assert parsed.local_dt == dt.datetime(2026, 8, 14, 6, 2)
    assert parsed.assumed_date is False


@pytest.mark.parametrize("text", ["", "재고 현황판", "총 계 128 개", "ABCDEF"])
def test_no_match_returns_none(text: str) -> None:
    assert parse_board_datetime(text, REFERENCE) is None


def test_invalid_calendar_date_falls_back_to_time_only() -> None:
    """2월 30일 같은 값은 날짜로 채택하지 않고, 시각만 살려 낮은 신뢰도로 넘긴다."""
    parsed = parse_board_datetime("2/30/2026 06:02", REFERENCE)
    assert parsed is not None
    assert parsed.pattern.startswith("time_only")
    assert parsed.local_dt == dt.datetime(2026, 8, 14, 6, 2)  # 수신일 기준
    assert parsed.assumed_date is True


def test_invalid_time_is_rejected() -> None:
    assert parse_board_datetime("8/14/2026 25:99", REFERENCE) is None
