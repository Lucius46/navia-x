from __future__ import annotations

import json
from urllib import error, request

from app.config import Settings


class SupabaseAuthenticationError(ValueError):
    pass


def authenticate_user(email: str, password: str, settings: Settings) -> str:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be configured for user login."
        )

    endpoint = f"{settings.supabase_url.rstrip('/')}/auth/v1/token?grant_type=password"
    payload = json.dumps({"email": email.strip().lower(), "password": password}).encode(
        "utf-8"
    )
    auth_request = request.Request(
        endpoint,
        data=payload,
        headers={
            "apikey": settings.supabase_anon_key,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(auth_request, timeout=10) as response:
            body = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        raw_error = exc.read().decode("utf-8", errors="ignore")
        try:
            parsed_error = json.loads(raw_error)
        except json.JSONDecodeError:
            parsed_error = {}

        message = parsed_error.get("msg") or parsed_error.get("message")
        if exc.code in {400, 401}:
            raise SupabaseAuthenticationError(message or "Invalid email or password.") from exc

        raise RuntimeError(
            message or "Supabase authentication request failed."
        ) from exc
    except error.URLError as exc:
        raise RuntimeError("Supabase authentication service is unreachable.") from exc

    user = body.get("user") or {}
    resolved_email = str(user.get("email") or email).strip().lower()
    if not resolved_email:
        raise SupabaseAuthenticationError("Authenticated user email is missing.")

    return resolved_email
