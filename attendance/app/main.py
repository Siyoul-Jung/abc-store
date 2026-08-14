"""FastAPI 앱 엔트리포인트.

    uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.db import init_db
from app.routers import dashboard, export, webhook

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    settings = get_settings()
    logging.getLogger(__name__).info(
        "출퇴근 시스템 기동 — tz=%s, OCR=%s, 서명검증=%s",
        settings.timezone_name,
        ",".join(settings.ocr_providers),
        settings.twilio_validate_signature,
    )
    yield


app = FastAPI(title="왓츠앱 출퇴근 관리", lifespan=lifespan)

app.include_router(webhook.router)
app.include_router(export.router)
app.include_router(dashboard.router)


@app.get("/health", tags=["ops"])
def health() -> dict[str, str]:
    return {"status": "ok"}
