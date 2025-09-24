from __future__ import annotations

import httpx
from typing import Sequence

from .base import Listing, UEXClient


class CookieHTTPClient(UEXClient):
    def __init__(self, base_url: str, cookie_header: str | None):
        self.base_url = base_url.rstrip("/")
        self.cookie_header = cookie_header
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"User-Agent": "Mozilla/5.0 ProjectUEXBot/0.1"},
            timeout=20.0,
        )

    async def close(self):
        await self._client.aclose()

    async def fetch_listings(self, user_id: str | None = None) -> Sequence[Listing]:
        if not self.cookie_header:
            raise RuntimeError("UEX_COOKIE_HEADER is required for cookie_http mode.")

        # TODO: Replace this path with the real listings endpoint
        # If an official API exists, call that instead. If the site returns HTML,
        # you may need to parse it (e.g., with selectolax/bs4). For JSON, parse directly.
        listings_url = "/"  # placeholder; update to something like '/api/listings' when known

        r = await self._client.get(
            listings_url,
            headers={
                "Cookie": self.cookie_header,
                "Accept": "text/html,application/json;q=0.9",
            },
        )

        if r.status_code >= 400:
            raise RuntimeError(f"UEX request failed: {r.status_code}")

        # Placeholder parsing: return empty until endpoint is confirmed
        # Replace with actual mapping from response -> List[Listing]
        return []

