"""수신 메시지 → 근무 기록 파이프라인.

webhook 은 record_message() 로 원본만 즉시 저장하고 곧바로 200 을 돌려준다.
무거운 작업(다운로드·OCR·집계)은 process_message() 에서 백그라운드로 처리한다.
"""

from __future__ import annotations

import datetime as dt
import json
import logging
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import session_scope
from app.models import (
    SOURCE_FALLBACK,
    SOURCE_OCR,
    Employee,
    Message,
    PunchEvent,
)
from app.services.attendance import rebuild_for_event
from app.services.media import download_media
from app.services.ocr import extract_timestamp
from app.utils.timeutil import to_local, to_utc, utc_now, work_date_for

logger = logging.getLogger(__name__)


def normalize_phone(raw: str | None) -> str:
    """'whatsapp:+82 10-1234-5678' → '+821012345678'."""
    if not raw:
        return ""
    value = raw.strip()
    if ":" in value:
        value = value.split(":", 1)[1]
    value = re.sub(r"[^\d+]", "", value)
    if value and not value.startswith("+"):
        value = "+" + value
    return value


def find_employee(session: Session, phone: str) -> Employee | None:
    return session.scalar(select(Employee).where(Employee.phone == phone))


def record_message(session: Session, payload: dict[str, str], provider: str = "twilio") -> Message:
    """webhook 원본을 저장한다. 같은 SID 가 이미 있으면 기존 건을 그대로 돌려준다(재전송 대비)."""
    sid = payload.get("MessageSid") or payload.get("SmsMessageSid") or ""
    if not sid:
        raise ValueError("MessageSid 가 없습니다")

    existing = session.scalar(select(Message).where(Message.provider_sid == sid))
    if existing is not None:
        logger.info("중복 webhook 무시: %s", sid)
        return existing

    phone = normalize_phone(payload.get("From"))
    employee = find_employee(session, phone)

    num_media = int(payload.get("NumMedia") or 0)
    media_url = payload.get("MediaUrl0") if num_media else None
    media_type = payload.get("MediaContentType0") if num_media else None

    message = Message(
        provider=provider,
        provider_sid=sid,
        from_phone=phone,
        employee_id=employee.id if employee else None,
        received_at=utc_now(),
        body=payload.get("Body"),
        media_url=media_url,
        media_content_type=media_type,
        raw_payload=json.dumps(payload, ensure_ascii=False),
    )
    if employee is None:
        message.process_error = f"미등록 번호: {phone}"

    session.add(message)
    session.flush()
    return message


def process_message(message_id: int) -> None:
    """백그라운드 처리: 미디어 다운로드 → OCR → 이벤트 생성 → 근무일 집계."""
    try:
        with session_scope() as session:
            message = session.get(Message, message_id)
            if message is None:
                logger.warning("메시지 없음: id=%s", message_id)
                return
            if message.employee_id is None:
                logger.warning("미등록 번호라 처리 중단: %s", message.from_phone)
                return
            if message.punch_event is not None:
                logger.info("이미 처리된 메시지: id=%s", message_id)
                return
            if not message.media_url:
                message.process_error = "사진이 없는 메시지"
                return

            try:
                path = download_media(
                    message.media_url, message.provider_sid, message.media_content_type
                )
                message.media_path = str(path)
            except Exception as exc:
                message.process_error = f"미디어 다운로드 실패: {exc}"
                logger.exception("미디어 다운로드 실패: %s", message.media_url)
                return

            create_punch_event(session, message, path)
    except Exception:
        logger.exception("메시지 처리 실패: id=%s", message_id)


def create_punch_event(session: Session, message: Message, image_path) -> PunchEvent:
    """OCR 결과로 근무 이벤트를 만든다. 실패 시 수신 시각을 대체값으로 쓰고 검토 플래그를 세운다."""
    settings = get_settings()
    reference_local = to_local(message.received_at)
    assert reference_local is not None

    outcome = extract_timestamp(image_path, reference_local)

    needs_review = False
    notes: list[str] = []

    if outcome.ok and outcome.parsed is not None:
        captured_at = to_utc(outcome.parsed.local_dt)
        source = SOURCE_OCR
        if outcome.confidence < settings.ocr_min_confidence:
            needs_review = True
            notes.append(f"OCR 신뢰도 낮음({outcome.confidence:.2f})")
        if outcome.parsed.assumed_date:
            needs_review = True
            notes.append("사진에 날짜가 없어 수신일 기준으로 추정")
        elif outcome.parsed.assumed_year:
            notes.append("연도 없음 — 수신 시각 기준 추정")

        drift = abs((captured_at - message.received_at).total_seconds()) / 3600
        if drift > settings.sanity_window_hours:
            needs_review = True
            notes.append(f"수신 시각과 {drift:.0f}시간 차이")
    else:
        captured_at = message.received_at
        source = SOURCE_FALLBACK
        needs_review = True
        notes.append("OCR 실패 — 수신 시각으로 대체")

    event = PunchEvent(
        message_id=message.id,
        employee_id=message.employee_id,
        captured_at=captured_at,
        work_date=work_date_for(captured_at),
        source=source,
        ocr_provider=outcome.raw.provider if outcome.raw else None,
        ocr_text=outcome.raw.text[:2000] if outcome.raw else None,
        ocr_confidence=outcome.confidence or None,
        needs_review=needs_review,
        review_note=" / ".join(notes)[:255] if notes else None,
    )
    session.add(event)
    session.flush()

    rebuild_for_event(session, event)
    logger.info(
        "이벤트 생성: employee=%s captured=%s source=%s review=%s",
        message.employee_id,
        captured_at,
        source,
        needs_review,
    )
    return event


def override_event_time(
    session: Session, event: PunchEvent, local_dt: dt.datetime, reviewer: str
) -> PunchEvent:
    """관리자가 시각을 직접 교정. 근무일이 바뀌면 이전 근무일도 재계산한다."""
    from app.services.attendance import rebuild_work_day  # 순환 임포트 방지

    previous_date = event.work_date
    event.captured_at = to_utc(local_dt)
    event.work_date = work_date_for(event.captured_at)
    event.source = "manual"
    event.needs_review = False
    event.reviewed_at = utc_now()
    event.reviewed_by = reviewer
    event.review_note = "관리자 수정"
    session.flush()

    if previous_date != event.work_date:
        rebuild_work_day(session, event.employee_id, previous_date)
    rebuild_for_event(session, event)
    return event


def mark_reviewed(session: Session, event: PunchEvent, reviewer: str) -> PunchEvent:
    """시각은 그대로 두고 '확인함' 처리만."""
    event.needs_review = False
    event.reviewed_at = utc_now()
    event.reviewed_by = reviewer
    session.flush()
    rebuild_for_event(session, event)
    return event
