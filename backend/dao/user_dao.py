import json
from typing import Any, Optional

from dao.database_adapter import DatabaseAdapter
from models.domain import User


class UserDao:
    _instance: Optional["UserDao"] = None

    def __init__(self, adapter: DatabaseAdapter):
        self._adapter = adapter

    @classmethod
    def get_instance(cls, adapter: Optional[DatabaseAdapter] = None) -> "UserDao":
        if cls._instance is None:
            if adapter is None:
                raise RuntimeError("UserDao not initialized — call get_instance(adapter) at startup")
            cls._instance = cls(adapter)
        return cls._instance

    @staticmethod
    def _to_user(row: dict[str, Any]) -> User:
        return User(
            id=str(row["id"]),
            created_at=row["created_at"],
            preferences=row["preferences"],
        )

    async def get_user_by_id(self, user_id: str) -> User | None:
        rows = await self._adapter.run_query(
            "SELECT * FROM users WHERE id = $1::uuid",
            (user_id,),
        )
        return self._to_user(rows[0]) if rows else None

    async def add_user(self, user_id: str) -> User:
        rows = await self._adapter.run_query(
            "INSERT INTO users (id, created_at) VALUES ($1::uuid, now()) RETURNING *",
            (user_id,),
        )
        return self._to_user(rows[0])

    async def update_preferences(self, user_id: str, preferences: dict) -> None:
        await self._adapter.run_query(
            "UPDATE users SET preferences = $1::jsonb WHERE id = $2::uuid",
            (json.dumps(preferences), user_id),
        )
