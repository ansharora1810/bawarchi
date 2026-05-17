from abc import ABC, abstractmethod
from typing import Any

import asyncpg


class DatabaseAdapter(ABC):
    @abstractmethod
    async def run_query(self, query: str, params: tuple = ()) -> list[dict[str, Any]]:
        ...


class PostgresAdapter(DatabaseAdapter):
    def __init__(self, dsn: str):
        self._dsn = dsn
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        self._pool = await asyncpg.create_pool(self._dsn)

    async def close(self) -> None:
        if self._pool:
            await self._pool.close()

    async def run_query(self, query: str, params: tuple = ()) -> list[dict[str, Any]]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
