import asyncio
import uuid

from dao.recipe_dao import RecipeDao
from models.domain import Recipe
from models.request import RecipeRequest
from services.extraction_service import ExtractionService


class RecipeService:
    def __init__(self):
        self._dao = RecipeDao.get_instance()
        self._extraction = ExtractionService.get_instance()

    async def get_by_id(self, recipe_id: str, user_id: str) -> Recipe | None:
        return await self._dao.get_recipe_by_id(recipe_id, user_id)

    async def list_recipes(self, user_id: str, page: int, limit: int, offset: int) -> tuple[list[Recipe], int]:
        recipes, total = await asyncio.gather(
            self._dao.get_all_recipes(user_id, limit, offset),
            self._dao.count_recipes(user_id),
        )
        return recipes, total

    async def delete_recipe(self, recipe_id: str, user_id: str) -> bool:
        return await self._dao.delete_recipe(recipe_id, user_id)

    async def create_recipe(self, user_id: str, request: RecipeRequest) -> Recipe:
        extracted = await self._extraction.extract(request)
        recipe = Recipe(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=extracted.name,
            ingredients=extracted.ingredients,
            steps=extracted.steps,
            cooking_time=extracted.cooking_time,
        )
        return await self._dao.add_recipe(recipe)