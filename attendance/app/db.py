"""DB 엔진/세션. SQLite 기본, DATABASE_URL 만 바꾸면 Postgres 로 이전 가능."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings

_settings = get_settings()

_connect_args = {"check_same_thread": False} if _settings.database_url.startswith("sqlite") else {}

engine = create_engine(_settings.database_url, connect_args=_connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)


def init_db() -> None:
    from app import models  # noqa: F401  (테이블 등록을 위해 임포트 필요)

    models.Base.metadata.create_all(engine)


@contextmanager
def session_scope() -> Iterator[Session]:
    """백그라운드 작업/스크립트용. 정상 종료 시 commit, 예외 시 rollback."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_session() -> Iterator[Session]:
    """FastAPI 의존성."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
