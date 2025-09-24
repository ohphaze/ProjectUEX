from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol, Sequence


@dataclass
class Listing:
    id: str
    title: str
    price: str
    quantity: str | None = None
    url: str | None = None


class UEXClient(Protocol):
    async def fetch_listings(self, user_id: str | None = None) -> Sequence[Listing]:
        ...

