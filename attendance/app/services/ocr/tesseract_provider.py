"""1차 OCR — Tesseract (무료, 로컬 실행).

tesseract 바이너리가 없으면 available() 이 False 를 반환하고 조용히 건너뛴다.
"""

from __future__ import annotations

import logging
from pathlib import Path

from app.config import get_settings
from app.services.ocr.base import OcrResult, crop_region

logger = logging.getLogger(__name__)


class TesseractProvider:
    name = "tesseract"

    def __init__(self) -> None:
        self._checked = False
        self._ok = False

    def available(self) -> bool:
        if self._checked:
            return self._ok
        self._checked = True
        try:
            import pytesseract  # noqa: PLC0415

            settings = get_settings()
            if settings.tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
            pytesseract.get_tesseract_version()
            self._ok = True
        except Exception as exc:  # 바이너리 미설치 등
            logger.info("tesseract 사용 불가 — 건너뜁니다 (%s)", exc)
            self._ok = False
        return self._ok

    def read(self, image_path: Path) -> OcrResult | None:
        if not self.available():
            return None
        try:
            import pytesseract  # noqa: PLC0415
            from PIL import Image, ImageOps  # noqa: PLC0415

            settings = get_settings()
            with Image.open(image_path) as raw:
                image = crop_region(raw.convert("L"), settings.ocr_crop)
                # 작은 글씨를 키우고 대비를 세운다 — 보드 LED/LCD 표시에 효과가 크다
                if max(image.size) < 1600:
                    scale = max(2, 1600 // max(image.size))
                    image = image.resize((image.width * scale, image.height * scale))
                image = ImageOps.autocontrast(image)

                data = pytesseract.image_to_data(
                    image,
                    output_type=pytesseract.Output.DICT,
                    config="--psm 6",
                )
        except Exception as exc:
            logger.warning("tesseract OCR 실패: %s", exc)
            return None

        words: list[str] = []
        confidences: list[float] = []
        for word, conf in zip(data.get("text", []), data.get("conf", []), strict=False):
            if not word or not word.strip():
                continue
            words.append(word.strip())
            try:
                value = float(conf)
            except (TypeError, ValueError):
                continue
            if value >= 0:
                confidences.append(value)

        if not words:
            return None

        confidence = (sum(confidences) / len(confidences) / 100) if confidences else 0.5
        return OcrResult(text=" ".join(words), confidence=round(confidence, 4), provider=self.name)
