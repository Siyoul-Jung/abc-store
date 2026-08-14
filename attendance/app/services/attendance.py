"""출퇴근 판별 및 집계.

규칙
  · 같은 근무일의 첫 사진 = 출근, 마지막 사진 = 퇴근
  · DEDUPE_MINUTES 이내 연속 사진은 1건으로 취급 (중복 전송 대비)
  · 사진이 1장뿐이면 open (퇴근 미기록)
  · 근무시간이 음수거나 MAX_SHIFT_HOURS 초과면 anomaly
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    STATUS_ANOMALY,
    STATUS_COMPLETE,
    STATUS_OPEN,
    PunchEvent,
    WorkDay,
)


def dedupe_events(events: list[PunchEvent], window_minutes: int) -> list[PunchEvent]:
    """시간순 정렬된 이벤트에서 window 이내 연속 건을 첫 건만 남기고 제거."""
    if not events:
        return []
    window = dt.timedelta(minutes=window_minutes)
    kept = [events[0]]
    for event in events[1:]:
        if event.captured_at - kept[-1].captured_at >= window:
            kept.append(event)
    return kept


def rebuild_work_day(session: Session, employee_id: int, work_date: dt.date) -> WorkDay | None:
    """해당 직원/근무일의 집계를 punch_events 로부터 다시 계산한다.

    이벤트가 하나도 없으면 기존 집계를 삭제하고 None 을 반환.
    """
    settings = get_settings()

    events = list(
        session.scalars(
            select(PunchEvent)
            .where(PunchEvent.employee_id == employee_id, PunchEvent.work_date == work_date)
            .order_by(PunchEvent.captured_at)
        )
    )

    work_day = session.scalar(
        select(WorkDay).where(WorkDay.employee_id == employee_id, WorkDay.work_date == work_date)
    )

    if not events:
        if work_day is not None:
            session.delete(work_day)
        return None

    if work_day is None:
        # ORM 기본값은 flush 시점에 적용되므로, 아래 계산에서 쓰기 전에 명시적으로 채운다
        work_day = WorkDay(
            employee_id=employee_id,
            work_date=work_date,
            worked_minutes=0,
            break_minutes=0,
            event_count=0,
            status=STATUS_OPEN,
            needs_review=False,
        )
        session.add(work_day)

    break_minutes = work_day.break_minutes or 0
    effective = dedupe_events(events, settings.dedupe_minutes)
    first = effective[0]
    last = effective[-1] if len(effective) > 1 else None

    notes: list[str] = []
    work_day.event_count = len(effective)
    work_day.check_in_at = first.captured_at
    work_day.check_in_event_id = first.id
    work_day.check_out_at = last.captured_at if last else None
    work_day.check_out_event_id = last.id if last else None

    if last is None:
        work_day.worked_minutes = 0
        work_day.status = STATUS_OPEN
        notes.append("사진 1장만 수신 — 퇴근 미기록")
    else:
        gross = int((last.captured_at - first.captured_at).total_seconds() // 60)
        work_day.break_minutes = break_minutes
        work_day.worked_minutes = max(0, gross - break_minutes)
        if gross < 0 or gross > settings.max_shift_hours * 60:
            work_day.status = STATUS_ANOMALY
            notes.append(f"근무시간 이상({gross // 60}시간 {gross % 60}분)")
        else:
            work_day.status = STATUS_COMPLETE

    if len(effective) > 2:
        notes.append(f"사진 {len(events)}장 중 첫/마지막 사용")

    flagged = [e for e in events if e.needs_review]
    if flagged:
        notes.append(f"검토 필요 {len(flagged)}건")

    work_day.needs_review = bool(flagged) or work_day.status != STATUS_COMPLETE
    work_day.note = " / ".join(notes) if notes else None

    session.flush()
    return work_day


def rebuild_for_event(session: Session, event: PunchEvent) -> None:
    """이벤트 1건 추가/수정 후 관련 근무일을 재계산한다."""
    rebuild_work_day(session, event.employee_id, event.work_date)


def rebuild_range(session: Session, start: dt.date, end: dt.date) -> int:
    """기간 내 모든 (직원, 근무일) 조합을 재계산한다. 설정 변경 후 일괄 반영용."""
    pairs = session.execute(
        select(PunchEvent.employee_id, PunchEvent.work_date)
        .where(PunchEvent.work_date >= start, PunchEvent.work_date <= end)
        .distinct()
    ).all()
    for employee_id, work_date in pairs:
        rebuild_work_day(session, employee_id, work_date)
    return len(pairs)
