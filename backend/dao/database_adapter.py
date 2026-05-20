import json
from abc import ABC, abstractmethod
from typing import Any

import asyncpg


class DatabaseAdapter(ABC):
    @abstractmethod
    async def run_query(self, query: str, params: tuple = ()) -> list[dict[str, Any]]:
        ...


async def _init_connection(conn: asyncpg.Connection) -> None:
    for type_name in ("json", "jsonb"):
        await conn.set_type_codec(
            type_name,
            encoder=json.dumps,
            decoder=json.loads,
            schema="pg_catalog",
        )


class PostgresAdapter(DatabaseAdapter):
    def __init__(self, dsn: str):
        self._dsn = dsn
        self._pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        self._pool = await asyncpg.create_pool(self._dsn, init=_init_connection)

    async def close(self) -> None:
        if self._pool:
            await self._pool.close()

    async def run_query(self, query: str, params: tuple = ()) -> list[dict[str, Any]]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
