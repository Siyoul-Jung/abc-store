"""엑셀(xlsx) 다운로드."""

from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.db import get_session
from app.security import AdminUser
from app.services.excel import build_workbook, filename_for, month_range

router = APIRouter(prefix="/export", tags=["export"])

_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _response(payload: bytes, start: dt.date, end: dt.date) -> Response:
    return Response(
        content=payload,
        media_type=_XLSX,
        headers={"Content-Disposition": f'attachment; filename="{filename_for(start, end)}"'},
    )


@router.get("/monthly.xlsx")
def monthly(
    admin: AdminUser,
    year: int,
    month: int,
    session: Session = Depends(get_session),
) -> Response:
    if not 1 <= month <= 12:
        raise HTTPException(status_code=400, detail="month 는 1~12 여야 합니다")
    start, end = month_range(year, month)
    return _response(build_workbook(session, start, end), start, end)


@router.get("/range.xlsx")
def date_range(
    admin: AdminUser,
    start: dt.date,
    end: dt.date,
    session: Session = Depends(get_session),
) -> Response:
    if start > end:
        raise HTTPException(status_code=400, detail="start 가 end 보다 늦습니다")
    return _response(build_workbook(session, start, end), start, end)
