"""관리자 화면 HTTP Basic 인증."""

from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.config import get_settings

_basic = HTTPBasic()


def require_admin(credentials: Annotated[HTTPBasicCredentials, Depends(_basic)]) -> str:
    settings = get_settings()
    user_ok = secrets.compare_digest(credentials.username, settings.admin_user)
    password_ok = secrets.compare_digest(credentials.password, settings.admin_password)
    if not (user_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 실패",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


AdminUser = Annotated[str, Depends(require_admin)]
