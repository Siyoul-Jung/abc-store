"""OCR provider 공통 인터페이스 + 이미지 전처리."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True)
class OcrResult:
    """OCR 원문과 provider 자체 신뢰도(0.0~1.0)."""

    text: str
    confidence: float
    provider: str


class OcrProvider(Protocol):
    name: str

    def available(self) -> bool:
        """설정/의존성이 갖춰져 실제 호출 가능한 상태인지."""

    def read(self, image_path: Path) -> OcrResult | None:
        """실패 시 None. 예외를 밖으로 던지지 않는다(다음 provider 로 넘어가야 하므로)."""


def crop_region(image, crop: tuple[float, float, float, float] | None):
    """비율 기반 크롭. 보드 시각이 늘 같은 위치에 찍힐 때 인식률을 크게 올린다."""
    if crop is None:
        return image
    width, height = image.size
    left, top, right, bottom = crop
    return image.crop(
        (int(width * left), int(height * top), int(width * right), int(height * bottom))
    )
