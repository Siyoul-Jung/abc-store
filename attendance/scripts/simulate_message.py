"""왓츠앱 없이 파이프라인(OCR→저장→집계) 전체를 그대로 테스트한다.

    python -m scripts.simulate_message +821012345678 sample.jpg [YYYY-MM-DDTHH:MM]

세 번째 인자로 수신 시각을 지정하면 과거 데이터도 만들 수 있다(미지정 시 현재 시각).
"""

from __future__ import annotations

import datetime as dt
import shutil
import sys
import uuid
from pathlib import Path

from app.config import get_settings
from app.db import init_db, session_scope
from app.models import Message
from app.services.ingest import create_punch_event, find_employee, normalize_phone
from app.utils.timeutil import format_datetime, to_utc, utc_now


def main() -> int:
    if len(sys.argv) not in (3, 4):
        print(__doc__)
        return 1

    phone = normalize_phone(sys.argv[1])
    image = Path(sys.argv[2])
    if not image.exists():
        print(f"이미지가 없습니다: {image}", file=sys.stderr)
        return 1

    received_at = (
        to_utc(dt.datetime.fromisoformat(sys.argv[3])) if len(sys.argv) == 4 else utc_now()
    )

    init_db()
    settings = get_settings()

    with session_scope() as session:
        employee = find_employee(session, phone)
        if employee is None:
            print(f"미등록 번호입니다: {phone} — 먼저 직원을 등록하세요", file=sys.stderr)
            return 1

        sid = f"SIM{uuid.uuid4().hex[:24]}"
        folder = settings.media_dir / received_at.strftime("%Y-%m")
        folder.mkdir(parents=True, exist_ok=True)
        target = folder / f"{sid}{image.suffix.lower()}"
        shutil.copy(image, target)

        message = Message(
            provider="simulate",
            provider_sid=sid,
            from_phone=phone,
            employee_id=employee.id,
            received_at=received_at,
            media_url=str(image),
            media_content_type=None,
            media_path=str(target),
        )
        session.add(message)
        session.flush()

        event = create_punch_event(session, message, target)
        print(f"직원      : {employee.name}")
        print(f"수신 시각  : {format_datetime(message.received_at)}")
        print(f"기록 시각  : {format_datetime(event.captured_at)}  (source={event.source})")
        print(f"근무일     : {event.work_date}")
        print(f"OCR       : {event.ocr_provider or '—'}  신뢰도={event.ocr_confidence or 0:.2f}")
        print(f"OCR 원문   : {(event.ocr_text or '—')[:200]}")
        if event.needs_review:
            print(f"⚠ 검토 필요: {event.review_note}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
