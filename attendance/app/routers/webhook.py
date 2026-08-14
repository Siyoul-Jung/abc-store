"""Twilio WhatsApp webhook 수신.

Twilio 는 15초 안에 응답을 기대하므로 여기서는 원본 저장까지만 하고
다운로드/OCR/집계는 BackgroundTasks 로 넘긴다.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_session
from app.services.ingest import process_message, record_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook", tags=["webhook"])

_EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'


def _validate_signature(request: Request, form: dict[str, str]) -> bool:
    settings = get_settings()
    if not settings.twilio_validate_signature:
        return True
    if not settings.twilio_auth_token:
        logger.error("TWILIO_AUTH_TOKEN 미설정 — 서명 검증 불가")
        return False

    from twilio.request_validator import RequestValidator  # noqa: PLC0415

    # 서명은 Twilio 에 등록된 URL 문자열 기준으로 계산되므로 PUBLIC_BASE_URL 을 사용한다
    url = settings.public_base_url.rstrip("/") + request.url.path
    signature = request.headers.get("X-Twilio-Signature", "")
    return RequestValidator(settings.twilio_auth_token).validate(url, form, signature)


@router.post("/twilio")
async def twilio_webhook(
    request: Request,
    background: BackgroundTasks,
    session: Session = Depends(get_session),
) -> Response:
    form = {key: str(value) for key, value in (await request.form()).items()}

    if not _validate_signature(request, form):
        logger.warning("Twilio 서명 검증 실패 (from=%s)", form.get("From"))
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="서명 검증 실패")

    try:
        message = record_message(session, form)
        session.commit()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if message.employee_id is not None and message.media_url and message.punch_event is None:
        background.add_task(process_message, message.id)

    return Response(content=_EMPTY_TWIML, media_type="application/xml")
