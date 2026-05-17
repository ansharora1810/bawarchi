from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class Unit(str, Enum):
    tsp = "tsp"
    tbsp = "tbsp"
    cup = "cup"
    ml = "ml"
    l = "l"
    g = "g"
    kg = "kg"
    oz = "oz"
    lb = "lb"
    piece = "piece"
    pinch = "pinch"
    clove = "clove"
    slice = "slice"


class RecipeStep(BaseModel):
    step: str
    time: Optional[int] = None  # milliseconds


class Ingredient(BaseModel):
    name: str
    quantity: str
    unit: Unit


class RecipeResponse(BaseModel):
    id: str
    name: str
    cooking_time: Optional[int] = None  # milliseconds
    ingredients: List[Ingredient]
    recipe_steps: List[RecipeStep]


class PaginatedRecipeResponse(BaseModel):
    recipes: List[RecipeResponse]
    page: int
    limit: int
    offset: int
    total: int
