"""2차 OCR — Claude Vision 폴백.

Tesseract 가 실패하거나 신뢰도가 낮을 때만 호출한다(비용 절감).
사진 속 보드에 표시된 날짜/시간 문자열만 그대로 뽑아 오게 하고, 해석은 parser.py 가 담당한다.
"""

from __future__ import annotations

import base64
import json
import logging
from pathlib import Path

from app.config import get_settings
from app.services.ocr.base import OcrResult, crop_region

logger = logging.getLogger(__name__)

_MEDIA_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
}

_PROMPT = (
    "이 사진에는 현장 디스플레이 보드가 찍혀 있고, 보드 어딘가(주로 우측 상단)에 "
    "실시간 날짜/시간이 표시되어 있습니다.\n"
    "보드에 **표시된** 날짜/시간 텍스트를 보이는 그대로 옮겨 적으세요. "
    "형식을 바꾸거나 해석하지 말고, 읽은 문자 그대로 반환합니다.\n"
    "- 날짜/시간이 보이지 않거나 읽을 수 없으면 datetime_text 를 null 로 두세요.\n"
    "- confidence 는 판독 확신도(0.0~1.0)입니다. 흐릿하거나 일부만 보이면 낮게 주세요.\n"
    "- 사진 촬영 시각을 추측하지 마세요. 보드에 실제로 표시된 값만 인정합니다."
)

_SCHEMA = {
    "type": "object",
    "properties": {
        "datetime_text": {
            "anyOf": [{"type": "string"}, {"type": "null"}],
            "description": "보드에 표시된 날짜/시간 문자열 원문. 없으면 null",
        },
        "confidence": {"type": "number", "description": "판독 확신도 0.0~1.0"},
    },
    "required": ["datetime_text", "confidence"],
    "additionalProperties": False,
}


class ClaudeVisionProvider:
    name = "claude"

    def available(self) -> bool:
        settings = get_settings()
        if not settings.anthropic_api_key:
            return False
        try:
            import anthropic  # noqa: F401, PLC0415
        except ImportError:
            logger.info("anthropic 패키지가 없어 Claude OCR 을 건너뜁니다")
            return False
        return True

    def read(self, image_path: Path) -> OcrResult | None:
        if not self.available():
            return None

        settings = get_settings()
        try:
            import anthropic  # noqa: PLC0415

            payload, media_type = self._encode(image_path)
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            response = client.messages.create(
                model=settings.ocr_claude_model,
                max_tokens=2048,
                output_config={"effort": "low", "format": {"type": "json_schema", "schema": _SCHEMA}},
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": payload,
                                },
                            },
                            {"type": "text", "text": _PROMPT},
                        ],
                    }
                ],
            )
        except Exception as exc:
            logger.warning("Claude OCR 호출 실패: %s", exc)
            return None

        if response.stop_reason == "refusal":
            logger.warning("Claude OCR 거절됨 (stop_reason=refusal)")
            return None

        text = next(
            (block.text for block in response.content if getattr(block, "type", None) == "text"),
            None,
        )
        if not text:
            return None

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Claude OCR 응답 파싱 실패: %.200s", text)
            return None

        datetime_text = data.get("datetime_text")
        if not datetime_text:
            return None

        confidence = data.get("confidence")
        confidence = float(confidence) if isinstance(confidence, (int, float)) else 0.7
        return OcrResult(
            text=str(datetime_text),
            confidence=max(0.0, min(1.0, confidence)),
            provider=self.name,
        )

    def _encode(self, image_path: Path) -> tuple[str, str]:
        """크롭 설정이 있으면 잘라서, 없으면 원본 그대로 base64 로 인코딩."""
        settings = get_settings()
        media_type = _MEDIA_TYPES.get(image_path.suffix.lower(), "image/jpeg")

        if settings.ocr_crop is None:
            return base64.standard_b64encode(image_path.read_bytes()).decode(), media_type

        import io  # noqa: PLC0415

        from PIL import Image  # noqa: PLC0415

        with Image.open(image_path) as raw:
            cropped = crop_region(raw.convert("RGB"), settings.ocr_crop)
            buffer = io.BytesIO()
            cropped.save(buffer, format="JPEG", quality=90)
        return base64.standard_b64encode(buffer.getvalue()).decode(), "image/jpeg"
