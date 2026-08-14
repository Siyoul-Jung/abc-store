"""관리자 대시보드 (서버 렌더링)."""

from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import BASE_DIR, get_settings
from app.db import get_session
from app.models import Employee, Message, PunchEvent, WorkDay
from app.security import AdminUser
from app.services.attendance import rebuild_work_day
from app.services.ingest import mark_reviewed, override_event_time
from app.utils.timeutil import (
    format_datetime,
    format_hhmm,
    format_time,
    to_local,
    utc_now,
)

router = APIRouter(tags=["dashboard"])

templates = Jinja2Templates(directory=str(BASE_DIR / "app" / "templates"))
templates.env.filters["hhmm"] = format_hhmm
templates.env.filters["localtime"] = format_time
templates.env.filters["localdatetime"] = format_datetime


def _today() -> dt.date:
    local = to_local(utc_now())
    assert local is not None
    return local.date()


@router.get("/")
def home(request: Request, admin: AdminUser, session: Session = Depends(get_session)):
    today = _today()

    rows = session.execute(
        select(WorkDay, Employee)
        .join(Employee, Employee.id == WorkDay.employee_id)
        .where(WorkDay.work_date == today)
        .order_by(WorkDay.check_in_at)
    ).all()
    checked_in_ids = {employee.id for _, employee in rows}

    absent = list(
        session.scalars(
            select(Employee)
            .where(Employee.active.is_(True), Employee.id.notin_(checked_in_ids or {0}))
            .order_by(Employee.name)
        )
    )

    pending = session.execute(
        select(PunchEvent, Employee)
        .join(Employee, Employee.id == PunchEvent.employee_id)
        .where(PunchEvent.needs_review.is_(True))
        .order_by(PunchEvent.captured_at.desc())
        .limit(50)
    ).all()

    unknown = list(
        session.scalars(
            select(Message)
            .where(Message.employee_id.is_(None))
            .order_by(Message.received_at.desc())
            .limit(10)
        )
    )

    return templates.TemplateResponse(
        request,
        "dashboard.html",
        {
            "today": today,
            "rows": rows,
            "absent": absent,
            "pending": pending,
            "unknown": unknown,
            "settings": get_settings(),
        },
    )


@router.get("/work-days")
def work_days(
    request: Request,
    admin: AdminUser,
    session: Session = Depends(get_session),
    year: int | None = None,
    month: int | None = None,
):
    today = _today()
    year = year or today.year
    month = month or today.month
    start = dt.date(year, month, 1)
    end = dt.date(year + (month == 12), (month % 12) + 1, 1) - dt.timedelta(days=1)

    rows = session.execute(
        select(WorkDay, Employee)
        .join(Employee, Employee.id == WorkDay.employee_id)
        .where(WorkDay.work_date >= start, WorkDay.work_date <= end)
        .order_by(Employee.name, WorkDay.work_date)
    ).all()

    totals = session.execute(
        select(
            Employee.name,
            func.count(WorkDay.id),
            func.sum(WorkDay.worked_minutes),
        )
        .join(WorkDay, WorkDay.employee_id == Employee.id)
        .where(WorkDay.work_date >= start, WorkDay.work_date <= end)
        .group_by(Employee.id)
        .order_by(Employee.name)
    ).all()

    return templates.TemplateResponse(
        request,
        "work_days.html",
        {
            "rows": rows,
            "totals": totals,
            "year": year,
            "month": month,
            "start": start,
            "end": end,
        },
    )


@router.get("/employees")
def employees(request: Request, admin: AdminUser, session: Session = Depends(get_session)):
    people = list(session.scalars(select(Employee).order_by(Employee.active.desc(), Employee.name)))
    return templates.TemplateResponse(request, "employees.html", {"employees": people})


@router.post("/employees")
def create_employee(
    admin: AdminUser,
    session: Session = Depends(get_session),
    name: str = Form(...),
    phone: str = Form(...),
    code: str = Form(""),
    memo: str = Form(""),
):
    from app.services.ingest import find_employee, normalize_phone

    normalized = normalize_phone(phone)
    if not normalized:
        raise HTTPException(status_code=400, detail="전화번호 형식이 올바르지 않습니다")

    employee = find_employee(session, normalized)
    if employee is None:
        employee = Employee(name=name, phone=normalized)
        session.add(employee)
    employee.name = name
    employee.code = code or None
    employee.memo = memo or None
    employee.active = True
    session.commit()
    return RedirectResponse("/employees", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/events/{event_id}/review")
def review_event(event_id: int, admin: AdminUser, session: Session = Depends(get_session)):
    event = session.get(PunchEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="이벤트를 찾을 수 없습니다")
    mark_reviewed(session, event, admin)
    session.commit()
    return RedirectResponse("/", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/events/{event_id}/time")
def update_event_time(
    event_id: int,
    admin: AdminUser,
    session: Session = Depends(get_session),
    local_dt: str = Form(...),
):
    event = session.get(PunchEvent, event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="이벤트를 찾을 수 없습니다")
    try:
        parsed = dt.datetime.fromisoformat(local_dt)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="시각 형식이 올바르지 않습니다") from exc

    override_event_time(session, event, parsed, admin)
    session.commit()
    return RedirectResponse("/", status_code=status.HTTP_303_SEE_OTHER)


@router.post("/work-days/{work_day_id}/break")
def update_break(
    work_day_id: int,
    admin: AdminUser,
    session: Session = Depends(get_session),
    break_minutes: int = Form(0),
):
    work_day = session.get(WorkDay, work_day_id)
    if work_day is None:
        raise HTTPException(status_code=404, detail="근무일을 찾을 수 없습니다")
    work_day.break_minutes = max(0, break_minutes)
    session.flush()
    rebuild_work_day(session, work_day.employee_id, work_day.work_date)
    session.commit()
    return RedirectResponse(
        f"/work-days?year={work_day.work_date.year}&month={work_day.work_date.month}",
        status_code=status.HTTP_303_SEE_OTHER,
    )
