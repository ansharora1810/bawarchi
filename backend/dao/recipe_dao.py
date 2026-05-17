import json
from typing import Any, Optional

from dao.database_adapter import DatabaseAdapter
from models.domain import IngredientDomain, Recipe, RecipeStepDomain


class RecipeDao:
    _instance: Optional["RecipeDao"] = None

    def __init__(self, adapter: DatabaseAdapter):
        self._adapter = adapter

    @classmethod
    def get_instance(cls, adapter: Optional[DatabaseAdapter] = None) -> "RecipeDao":
        if cls._instance is None:
            if adapter is None:
                raise RuntimeError("RecipeDao not initialized — call get_instance(adapter) at startup")
            cls._instance = cls(adapter)
        return cls._instance

    @staticmethod
    def _to_recipe(row: dict[str, Any]) -> Recipe:
        return Recipe(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            name=row["name"],
            cooking_time=row["cooking_time"],
            ingredients=[IngredientDomain(**i) for i in row["ingredients"]],
            steps=[RecipeStepDomain(**s) for s in row["steps"]],
        )

    async def get_all_recipes(self, user_id: str, limit: int, offset: int) -> list[Recipe]:
        rows = await self._adapter.run_query(
            "SELECT * FROM recipes WHERE user_id = $1::uuid ORDER BY created_at DESC LIMIT $2 OFFSET $3",
            (user_id, limit, offset),
        )
        return [self._to_recipe(row) for row in rows]

    async def count_recipes(self, user_id: str) -> int:
        rows = await self._adapter.run_query(
            "SELECT COUNT(*) FROM recipes WHERE user_id = $1::uuid",
            (user_id,),
        )
        return rows[0]["count"] if rows else 0

    async def get_recipe_by_id(self, recipe_id: str, user_id: str) -> Recipe | None:
        rows = await self._adapter.run_query(
            "SELECT * FROM recipes WHERE id = $1::uuid AND user_id = $2::uuid",
            (recipe_id, user_id),
        )
        return self._to_recipe(rows[0]) if rows else None

    async def delete_recipe(self, recipe_id: str, user_id: str) -> bool:
        rows = await self._adapter.run_query(
            "DELETE FROM recipes WHERE id = $1::uuid AND user_id = $2::uuid RETURNING id",
            (recipe_id, user_id),
        )
        return len(rows) > 0

    async def add_recipe(self, recipe: Recipe) -> Recipe:
        rows = await self._adapter.run_query(
            """
            INSERT INTO recipes (id, user_id, name, ingredients, steps, cooking_time, cooked, favorite, created_at)
            VALUES ($1::uuid, $2::uuid, $3, $4::jsonb, $5::jsonb, $6, false, false, now())
            RETURNING *
            """,
            (
                recipe.id,
                recipe.user_id,
                recipe.name,
                json.dumps([i.__dict__ for i in recipe.ingredients]),
                json.dumps([s.__dict__ for s in recipe.steps]),
                recipe.cooking_time,
            ),
        )
        return self._to_recipe(rows[0])