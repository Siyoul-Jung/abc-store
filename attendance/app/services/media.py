"""Twilio 미디어 다운로드 및 로컬 저장."""

from __future__ import annotations

import logging
import mimetypes
from pathlib import Path

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

_DEFAULT_SUFFIX = ".jpg"


def _suffix_for(content_type: str | None) -> str:
    if not content_type:
        return _DEFAULT_SUFFIX
    guessed = mimetypes.guess_extension(content_type.split(";")[0].strip())
    if guessed in {".jpe", ".jpeg"}:
        return ".jpg"
    return guessed or _DEFAULT_SUFFIX


def download_media(url: str, message_sid: str, content_type: str | None, index: int = 0) -> Path:
    """미디어를 MEDIA_DIR/YYYY-MM 아래에 저장하고 경로를 반환한다.

    Twilio 미디어 URL 은 계정 인증이 필요하므로 SID/토큰으로 basic auth 를 건다.
    """
    settings = get_settings()
    auth = None
    if settings.twilio_account_sid and settings.twilio_auth_token:
        auth = (settings.twilio_account_sid, settings.twilio_auth_token)

    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        response = client.get(url, auth=auth)
        response.raise_for_status()
        payload = response.content
        resolved_type = content_type or response.headers.get("content-type")

    from app.utils.timeutil import utc_now  # 순환 임포트 방지를 위해 지연 임포트

    folder = settings.media_dir / utc_now().strftime("%Y-%m")
    folder.mkdir(parents=True, exist_ok=True)

    filename = f"{message_sid}_{index}{_suffix_for(resolved_type)}"
    path = folder / filename
    path.write_bytes(payload)
    logger.info("미디어 저장: %s (%d bytes)", path, len(payload))
    return path
