from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class RecipeStepDomain:
    step: str
    time: Optional[int] = None  # milliseconds


@dataclass
class IngredientDomain:
    name: str
    quantity: str
    unit: str


@dataclass
class ExtractedRecipe:
    name: str
    ingredients: list[IngredientDomain] = field(default_factory=list)
    steps: list[RecipeStepDomain] = field(default_factory=list)
    cooking_time: Optional[int] = None  # milliseconds


@dataclass
class Recipe:
    id: str
    user_id: str
    name: str
    ingredients: list[IngredientDomain] = field(default_factory=list)
    steps: list[RecipeStepDomain] = field(default_factory=list)
    cooking_time: Optional[int] = None  # milliseconds


@dataclass
class User:
    id: str
    created_at: datetime
    preferences: Optional[dict] = None