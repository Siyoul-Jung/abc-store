"""DB 스키마.

시각 저장 규칙: **모든 datetime 컬럼은 naive UTC**.
표시/집계할 때만 app.utils.timeutil.to_local() 로 변환한다.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# punch_events.source
SOURCE_OCR = "ocr"
SOURCE_FALLBACK = "fallback"
SOURCE_MANUAL = "manual"

# work_days.status
STATUS_COMPLETE = "complete"
STATUS_OPEN = "open"
STATUS_ANOMALY = "anomaly"


class Base(DeclarativeBase):
    pass


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    code: Mapped[str | None] = mapped_column(String(32))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    memo: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, server_default=func.now())

    def __repr__(self) -> str:  # pragma: no cover - 디버깅용
        return f"<Employee {self.name} {self.phone}>"


class Message(Base):
    """수신 원본. 감사 추적용이라 생성 후 내용은 수정하지 않는다."""

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    provider: Mapped[str] = mapped_column(String(20), nullable=False, default="twilio")
    provider_sid: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    from_phone: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"))
    received_at: Mapped[dt.datetime] = mapped_column(DateTime, nullable=False, index=True)
    body: Mapped[str | None] = mapped_column(Text)
    media_url: Mapped[str | None] = mapped_column(Text)
    media_content_type: Mapped[str | None] = mapped_column(String(80))
    media_path: Mapped[str | None] = mapped_column(Text)
    raw_payload: Mapped[str | None] = mapped_column(Text)
    process_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, server_default=func.now())

    employee: Mapped[Employee | None] = relationship()
    punch_event: Mapped["PunchEvent | None"] = relationship(back_populates="message")


class PunchEvent(Base):
    """인증 사진 1장 = 1건. captured_at 이 공식 기록."""

    __tablename__ = "punch_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    message_id: Mapped[int] = mapped_column(ForeignKey("messages.id"), nullable=False, unique=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)

    captured_at: Mapped[dt.datetime] = mapped_column(DateTime, nullable=False, index=True)
    work_date: Mapped[dt.date] = mapped_column(Date, nullable=False, index=True)

    source: Mapped[str] = mapped_column(String(16), nullable=False, default=SOURCE_OCR)
    ocr_provider: Mapped[str | None] = mapped_column(String(32))
    ocr_text: Mapped[str | None] = mapped_column(Text)
    ocr_confidence: Mapped[float | None] = mapped_column(Float)

    needs_review: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    review_note: Mapped[str | None] = mapped_column(String(255))
    reviewed_at: Mapped[dt.datetime | None] = mapped_column(DateTime)
    reviewed_by: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, server_default=func.now())

    message: Mapped[Message] = relationship(back_populates="punch_event")
    employee: Mapped[Employee] = relationship()


class WorkDay(Base):
    """직원×근무일 집계. punch_events 로부터 언제든 재생성 가능한 파생 테이블."""

    __tablename__ = "work_days"
    __table_args__ = (UniqueConstraint("employee_id", "work_date", name="uq_workday_employee_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    work_date: Mapped[dt.date] = mapped_column(Date, nullable=False, index=True)

    check_in_at: Mapped[dt.datetime | None] = mapped_column(DateTime)
    check_out_at: Mapped[dt.datetime | None] = mapped_column(DateTime)
    check_in_event_id: Mapped[int | None] = mapped_column(ForeignKey("punch_events.id"))
    check_out_event_id: Mapped[int | None] = mapped_column(ForeignKey("punch_events.id"))

    worked_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    break_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    event_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    status: Mapped[str] = mapped_column(String(16), nullable=False, default=STATUS_OPEN)
    needs_review: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    note: Mapped[str | None] = mapped_column(String(255))
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    employee: Mapped[Employee] = relationship()
