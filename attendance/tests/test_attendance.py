"""출퇴근 판별/집계 로직 테스트."""

from __future__ import annotations

import datetime as dt

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.models import (
    SOURCE_OCR,
    STATUS_ANOMALY,
    STATUS_COMPLETE,
    STATUS_OPEN,
    Base,
    Employee,
    Message,
    PunchEvent,
)
from app.services.attendance import rebuild_work_day
from app.utils.timeutil import format_hhmm, to_utc, work_date_for

WORK_DATE = dt.date(2026, 8, 14)


@pytest.fixture()
def session() -> Session:
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    with Session(engine, future=True) as session:
        yield session


@pytest.fixture()
def employee(session: Session) -> Employee:
    employee = Employee(name="김철수", phone="+821012345678")
    session.add(employee)
    session.flush()
    return employee


def add_event(
    session: Session,
    employee: Employee,
    local_time: str,
    *,
    work_date: dt.date = WORK_DATE,
    needs_review: bool = False,
    day_offset: int = 0,
) -> PunchEvent:
    """'06:00' 같은 로컬 시각으로 이벤트를 하나 만든다."""
    hour, minute = (int(part) for part in local_time.split(":"))
    local_dt = dt.datetime.combine(
        WORK_DATE + dt.timedelta(days=day_offset), dt.time(hour, minute)
    )
    captured_at = to_utc(local_dt)

    message = Message(
        provider="test",
        provider_sid=f"SID{employee.id}-{day_offset}-{local_time}",
        from_phone=employee.phone,
        employee_id=employee.id,
        received_at=captured_at,
    )
    session.add(message)
    session.flush()

    event = PunchEvent(
        message_id=message.id,
        employee_id=employee.id,
        captured_at=captured_at,
        work_date=work_date,
        source=SOURCE_OCR,
        needs_review=needs_review,
    )
    session.add(event)
    session.flush()
    return event


def test_first_and_last_photo_become_check_in_out(session: Session, employee: Employee) -> None:
    add_event(session, employee, "06:00")
    add_event(session, employee, "15:30")

    work_day = rebuild_work_day(session, employee.id, WORK_DATE)

    assert work_day is not None
    assert work_day.status == STATUS_COMPLETE
    assert work_day.worked_minutes == 570
    assert format_hhmm(work_day.worked_minutes) == "9:30"
    assert work_day.needs_review is False


def test_middle_photos_are_ignored_but_noted(session: Session, employee: Employee) -> None:
    add_event(session, employee, "06:00")
    add_event(session, employee, "12:00")
    add_event(session, employee, "18:00")

    work_day = rebuild_work_day(session, employee.id, WORK_DATE)

    assert work_day.worked_minutes == 720
    assert work_day.event_count == 3
    assert "첫/마지막" in work_day.note


def test_single_photo_is_open_and_needs_review(session: Session, employee: Employee) -> None:
    add_event(session, employee, "06:00")

    work_day = rebuild_work_day(session, employee.id, WORK_DATE)

    assert work_day.status == STATUS_OPEN
    assert work_day.check_out_at is None
    assert work_day.worked_minutes == 0
    assert work_day.needs_review is True


def test_duplicate_photos_within_window_are_deduped(session: Session, employee: Employee) -> None:
    """중복 전송(10분 이내)은 1건으로 취급한다."""
    add_event(session, employee, "06:00")
    add_event(session, employee, "06:05")
    add_event(session, employee, "15:00")

    work_day = rebuild_work_day(session, employee.id, WORK_DATE)

    assert work_day.event_count == 2
    assert work_day.worked_minutes == 540
    assert work_day.status == STATUS_COMPLETE


def test_only_duplicates_still_counts_as_one_punch(session: Session, employee: Employee) -> None:
    add_event(session, employee, "06:00")
    add_event(session, employee, "06:03")

    work_day = rebuild_work_day(session, employee.id, WORK_DATE)

    assert work_day.status == STATUS_OPEN
    assert work_day.event_count == 1


def test_excessive_shift_is_flagged_as_anomaly(session: Session, employee: Employee) -> None:
    """같은 근무일에 20시간 간격이면 사람이 확인해야 한다."""
    add_event(session, employee, "06:00")
    add_event(session, employee, "02:00", day_offset=1)

    work_day = rebuild_work_day(session, employee.id, WORK_DATE)

    assert work_day.status == STATUS_ANOMALY
    assert work_day.needs_review is True


def test_break_minutes_are_subtracted(session: Session, employee: Employee) -> None:
    add_event(session, employee, "09:00")
    add_event(session, employee, "18:00")

    work_day = rebuild_work_day(session, employee.id, WORK_DATE)
    work_day.break_minutes = 60
    session.flush()
    work_day = rebuild_work_day(session, employee.id, WORK_DATE)

    assert work_day.worked_minutes == 480


def test_event_review_flag_propagates_to_work_day(session: Session, employee: Employee) -> None:
    add_event(session, employee, "06:00", needs_review=True)
    add_event(session, employee, "15:00")

    work_day = rebuild_work_day(session, employee.id, WORK_DATE)

    assert work_day.needs_review is True
    assert "검토 필요 1건" in work_day.note


def test_rebuild_removes_work_day_when_no_events(session: Session, employee: Employee) -> None:
    event = add_event(session, employee, "06:00")
    rebuild_work_day(session, employee.id, WORK_DATE)

    session.delete(event)
    session.flush()

    assert rebuild_work_day(session, employee.id, WORK_DATE) is None


def test_night_shift_belongs_to_previous_work_date() -> None:
    """새벽 01:30 퇴근은 전날 근무일로 귀속된다 (DAY_CUTOFF_HOUR=4)."""
    late = to_utc(dt.datetime(2026, 8, 15, 1, 30))
    assert work_date_for(late) == dt.date(2026, 8, 14)

    morning = to_utc(dt.datetime(2026, 8, 15, 6, 0))
    assert work_date_for(morning) == dt.date(2026, 8, 15)


def test_format_hhmm() -> None:
    assert format_hhmm(450) == "7:30"
    assert format_hhmm(0) == "0:00"
    assert format_hhmm(60) == "1:00"
