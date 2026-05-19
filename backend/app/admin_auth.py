import hashlib
import hmac

from fastapi import Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse, Response

from app.config import Settings, get_settings

ADMIN_COOKIE_NAME = "navia_admin_session"


def _build_session_value(settings: Settings) -> str:
    normalized_email = settings.admin_email.strip().lower()
    signature = hmac.new(
        settings.resolved_admin_session_secret.encode("utf-8"),
        normalized_email.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{normalized_email}:{signature}"


def is_admin_authenticated(request: Request, settings: Settings) -> bool:
    session_value = request.cookies.get(ADMIN_COOKIE_NAME)
    if not session_value:
        return False
    return hmac.compare_digest(session_value, _build_session_value(settings))


def require_admin_session(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    if not is_admin_authenticated(request, settings):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员登录已失效，请重新登录。",
        )


def verify_admin_credentials(email: str, password: str, settings: Settings) -> bool:
    normalized_email = email.strip().lower()
    return normalized_email == settings.admin_email.strip().lower() and hmac.compare_digest(
        password,
        settings.admin_password,
    )


def set_admin_cookie(response: Response, settings: Settings) -> None:
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=_build_session_value(settings),
        httponly=True,
        samesite="lax",
        secure=settings.app_env.lower() == "production",
        max_age=60 * 60 * 12,
        path="/",
    )


def clear_admin_cookie(response: Response) -> None:
    response.delete_cookie(ADMIN_COOKIE_NAME, path="/")


def redirect_to_admin_login() -> RedirectResponse:
    return RedirectResponse(url="/admin/login", status_code=status.HTTP_303_SEE_OTHER)
