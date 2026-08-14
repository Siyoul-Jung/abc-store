"""시각 변환 헬퍼.

DB 에는 naive UTC 만 들어간다. 화면/엑셀/파싱 결과는 모두 로컬(TIMEZONE) 기준이므로
경계에서 반드시 이 함수들을 거친다.
"""

from __future__ import annotations

import datetime as dt

from app.config import get_settings


def utc_now() -> dt.datetime:
    """naive UTC 현재 시각."""
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)


def to_utc(local_naive: dt.datetime) -> dt.datetime:
    """로컬 naive → UTC naive."""
    tz = get_settings().tz
    return local_naive.replace(tzinfo=tz).astimezone(dt.timezone.utc).replace(tzinfo=None)


def to_local(utc_naive: dt.datetime | None) -> dt.datetime | None:
    """UTC naive → 로컬 naive."""
    if utc_naive is None:
        return None
    tz = get_settings().tz
    return utc_naive.replace(tzinfo=dt.timezone.utc).astimezone(tz).replace(tzinfo=None)


def work_date_for(utc_naive: dt.datetime) -> dt.date:
    """야간근무 컷오프를 적용한 소속 근무일.

    DAY_CUTOFF_HOUR=4 이면 로컬 03:59 은 전날 근무로 귀속된다.
    """
    settings = get_settings()
    local = to_local(utc_naive)
    assert local is not None
    if local.hour < settings.day_cutoff_hour:
        return (local - dt.timedelta(days=1)).date()
    return local.date()


def format_hhmm(minutes: int) -> str:
    """450 → '7:30'. 음수는 부호를 붙여 표시."""
    sign = "-" if minutes < 0 else ""
    minutes = abs(int(minutes))
    return f"{sign}{minutes // 60}:{minutes % 60:02d}"


def format_time(utc_naive: dt.datetime | None) -> str:
    local = to_local(utc_naive)
    return local.strftime("%H:%M") if local else "—"


def format_datetime(utc_naive: dt.datetime | None) -> str:
    local = to_local(utc_naive)
    return local.strftime("%Y-%m-%d %H:%M") if local else "—"
