from __future__ import annotations

from typing import Sequence

from .base import Listing, UEXClient


class MockClient(UEXClient):
    async def fetch_listings(self, user_id: str | None = None) -> Sequence[Listing]:
        return [
            Listing(id="123", title="Laranite Ore", price="12,500 aUEC", quantity="200 SCU", url=None),
            Listing(id="124", title="Titanium", price="8,400 aUEC", quantity="150 SCU", url=None),
            Listing(id="125", title="Medical Supplies", price="5,200 aUEC", quantity="75 SCU", url=None),
        ]

