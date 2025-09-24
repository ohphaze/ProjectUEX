from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass
class Settings:
    discord_token: str
    uex_base_url: str
    uex_auth_mode: str  # mock | cookie_http
    uex_cookie_header: str | None = None


def get_settings() -> Settings:
    load_dotenv()
    token = os.getenv("DISCORD_TOKEN", "").strip()
    if not token:
        raise RuntimeError("DISCORD_TOKEN is required. Set it in .env")

    base_url = os.getenv("UEX_BASE_URL", "https://uexcorp.space").rstrip("/")
    auth_mode = os.getenv("UEX_AUTH_MODE", "mock").strip()
    cookie_header = os.getenv("UEX_COOKIE_HEADER")

    return Settings(
        discord_token=token,
        uex_base_url=base_url,
        uex_auth_mode=auth_mode,
        uex_cookie_header=cookie_header.strip() if cookie_header else None,
    )

