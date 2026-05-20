from abc import ABC, abstractmethod
from typing import Optional, cast

import anthropic
import httpx
from bs4 import BeautifulSoup
from google import genai
from google.genai import types

from models.domain import ExtractedRecipe, IngredientDomain, RecipeStepDomain
from models.request import RecipeRequest

_EXTRACT_RECIPE_TOOL = {
    "name": "save_recipe",
    "description": "Save the structured recipe extracted from the provided text.",
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "cooking_time": {
                "type": "integer",
                "description": "Total cooking time in milliseconds. Omit if not specified.",
            },
            "ingredients": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "quantity": {"type": "string"},
                        "unit": {
                            "type": "string",
                            "enum": ["tsp", "tbsp", "cup", "ml", "l", "g", "kg", "oz", "lb", "piece", "pinch", "clove", "slice"],
                        },
                    },
                    "required": ["name", "quantity", "unit"],
                },
            },
            "steps": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "step": {"type": "string"},
                        "time": {
                            "type": "integer",
                            "description": "Duration for this step in milliseconds. Omit if no timer needed.",
                        },
                    },
                    "required": ["step"],
                },
            },
        },
        "required": ["name", "ingredients", "steps"],
    },
}


class AIProvider(ABC):
    @abstractmethod
    async def extract_from_text(self, text: str) -> ExtractedRecipe:
        ...


class AnthropicAdapter(AIProvider):
    def __init__(self, api_key: str):
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    async def extract_from_text(self, text: str) -> ExtractedRecipe:
        response = await self._client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            tools=[_EXTRACT_RECIPE_TOOL],
            tool_choice={"type": "tool", "name": "save_recipe"},
            messages=[{"role": "user", "content": f"Extract the recipe from this text:\n\n{text}"}],
        )
        tool_use = next(b for b in response.content if b.type == "tool_use")
        data = cast(dict, tool_use.input)
        return ExtractedRecipe(
            name=data["name"],
            cooking_time=data.get("cooking_time"),
            ingredients=[IngredientDomain(**i) for i in data["ingredients"]],
            steps=[RecipeStepDomain(**s) for s in data["steps"]],
        )


class GeminiAdapter(AIProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self._client = genai.Client(api_key=api_key)
        self._model = model
        self._tool = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name=_EXTRACT_RECIPE_TOOL["name"],
                    description=_EXTRACT_RECIPE_TOOL["description"],
                    parameters=_EXTRACT_RECIPE_TOOL["input_schema"],
                )
            ]
        )

    async def extract_from_text(self, text: str) -> ExtractedRecipe:
        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=f"Extract the recipe from this text:\n\n{text}",
            config=types.GenerateContentConfig(
                tools=[self._tool],
                tool_config=types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(
                        mode="ANY",
                        allowed_function_names=["save_recipe"],
                    )
                ),
            ),
        )
        function_call = next(
            p.function_call for p in response.candidates[0].content.parts if p.function_call
        )
        data = cast(dict, dict(function_call.args))
        return ExtractedRecipe(
            name=data["name"],
            cooking_time=data.get("cooking_time"),
            ingredients=[IngredientDomain(**i) for i in data["ingredients"]],
            steps=[RecipeStepDomain(**s) for s in data["steps"]],
        )


class ExtractionService:
    _instance: Optional["ExtractionService"] = None

    def __init__(self, provider: AIProvider):
        self._provider = provider

    @classmethod
    def get_instance(cls, provider: Optional[AIProvider] = None) -> "ExtractionService":
        if cls._instance is None:
            if provider is None:
                raise RuntimeError("ExtractionService not initialized — call get_instance(provider) at startup")
            cls._instance = cls(provider)
        return cls._instance

    async def extract(self, request: RecipeRequest) -> ExtractedRecipe:
        if request.recipe_url:
            text = await self._fetch_url_text(request.recipe_url)
        else:
            text = request.recipe_text
        return await self._provider.extract_from_text(text)

    @staticmethod
    async def _fetch_url_text(url: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            return soup.get_text(separator=" ", strip=True)
