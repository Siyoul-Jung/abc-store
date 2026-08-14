"""환경변수 로딩. 모든 튜닝 값은 여기 한 곳에서만 읽는다."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def _bool(key: str, default: bool) -> bool:
    raw = os.getenv(key)
    if raw is None or raw == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _int(key: str, default: int) -> int:
    raw = os.getenv(key)
    if raw is None or raw.strip() == "":
        return default
    return int(raw)


def _float(key: str, default: float) -> float:
    raw = os.getenv(key)
    if raw is None or raw.strip() == "":
        return default
    return float(raw)


def _crop(raw: str | None) -> tuple[float, float, float, float] | None:
    """'0.45,0,1,0.35' → (0.45, 0.0, 1.0, 0.35). 비어 있으면 None."""
    if not raw or not raw.strip():
        return None
    parts = [p.strip() for p in raw.split(",")]
    if len(parts) != 4:
        raise ValueError("OCR_CROP 은 left,top,right,bottom 네 개의 비율이어야 합니다")
    left, top, right, bottom = (float(p) for p in parts)
    if not (0 <= left < right <= 1 and 0 <= top < bottom <= 1):
        raise ValueError("OCR_CROP 값은 0~1 범위이고 left<right, top<bottom 이어야 합니다")
    return left, top, right, bottom


@dataclass(frozen=True)
class Settings:
    public_base_url: str = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")
    timezone_name: str = os.getenv("TIMEZONE", "Asia/Seoul")
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'attendance.db'}")
    media_dir: Path = Path(os.getenv("MEDIA_DIR") or (BASE_DIR / "media"))

    admin_user: str = os.getenv("ADMIN_USER", "admin")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "change-me-now")

    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    twilio_whatsapp_number: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "")
    twilio_validate_signature: bool = _bool("TWILIO_VALIDATE_SIGNATURE", True)

    ocr_providers: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            p.strip() for p in os.getenv("OCR_PROVIDERS", "tesseract,claude").split(",") if p.strip()
        )
    )
    ocr_min_confidence: float = _float("OCR_MIN_CONFIDENCE", 0.6)
    ocr_crop: tuple[float, float, float, float] | None = field(
        default_factory=lambda: _crop(os.getenv("OCR_CROP"))
    )
    tesseract_cmd: str = os.getenv("TESSERACT_CMD", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    ocr_claude_model: str = os.getenv("OCR_CLAUDE_MODEL", "claude-opus-5")

    date_order: str = os.getenv("DATE_ORDER", "MDY").upper()
    day_cutoff_hour: int = _int("DAY_CUTOFF_HOUR", 4)
    dedupe_minutes: int = _int("DEDUPE_MINUTES", 10)
    max_shift_hours: int = _int("MAX_SHIFT_HOURS", 16)
    sanity_window_hours: int = _int("SANITY_WINDOW_HOURS", 48)

    @property
    def tz(self) -> ZoneInfo:
        return ZoneInfo(self.timezone_name)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.media_dir.mkdir(parents=True, exist_ok=True)
    return settings
