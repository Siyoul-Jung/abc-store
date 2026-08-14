"""OCR 파이프라인.

OCR_PROVIDERS 순서대로 시도 → 원문 확보 → parser 로 날짜/시간 해석 →
최종 신뢰도가 OCR_MIN_CONFIDENCE 이상이면 즉시 채택, 아니면 다음 provider.
"""

from __future__ import annotations

import datetime as dt
import logging
from dataclasses import dataclass
from pathlib import Path

from app.config import get_settings
from app.services.ocr.base import OcrResult
from app.services.ocr.claude_provider import ClaudeVisionProvider
from app.services.ocr.parser import ParsedTimestamp, parse_board_datetime
from app.services.ocr.tesseract_provider import TesseractProvider

logger = logging.getLogger(__name__)

_PROVIDERS = {
    TesseractProvider.name: TesseractProvider,
    ClaudeVisionProvider.name: ClaudeVisionProvider,
}

_instances: dict[str, object] = {}


@dataclass(frozen=True)
class OcrOutcome:
    """OCR + 파싱 최종 결과."""

    parsed: ParsedTimestamp | None
    raw: OcrResult | None
    confidence: float

    @property
    def ok(self) -> bool:
        return self.parsed is not None


def _provider(name: str):
    if name not in _PROVIDERS:
        logger.warning("알 수 없는 OCR provider: %s", name)
        return None
    if name not in _instances:
        _instances[name] = _PROVIDERS[name]()
    return _instances[name]


def extract_timestamp(image_path: Path, reference_local: dt.datetime) -> OcrOutcome:
    """사진에서 보드 시각을 읽어낸다.

    Args:
        image_path: 이미지 파일 경로
        reference_local: 연/월/일이 빠졌을 때 기준으로 삼을 로컬 시각(메시지 수신 시각)
    """
    settings = get_settings()
    best = OcrOutcome(parsed=None, raw=None, confidence=0.0)

    for name in settings.ocr_providers:
        provider = _provider(name)
        if provider is None or not provider.available():
            continue

        raw = provider.read(image_path)
        if raw is None:
            logger.info("[%s] OCR 결과 없음", name)
            continue

        parsed = parse_board_datetime(raw.text, reference_local, settings.date_order)
        if parsed is None:
            logger.info("[%s] 날짜/시간 패턴 미발견: %.120s", name, raw.text)
            if best.raw is None:
                best = OcrOutcome(parsed=None, raw=raw, confidence=0.0)
            continue

        confidence = round(parsed.confidence * max(raw.confidence, 0.1), 4)
        outcome = OcrOutcome(parsed=parsed, raw=raw, confidence=confidence)
        if confidence >= settings.ocr_min_confidence:
            return outcome
        logger.info("[%s] 신뢰도 미달(%.2f) — 다음 provider 시도", name, confidence)
        if confidence > best.confidence:
            best = outcome

    return best
