import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel, model_validator


class SourceType(str, Enum):
    youtube = "youtube"
    audio = "audio"
    video = "video"
    pdf = "pdf"
    image = "image"
    url = "url"


class RecipeRequest(BaseModel):
    recipe_text: Optional[str] = None
    recipe_url: Optional[str] = None
    source_type: Optional[SourceType] = None

    @model_validator(mode="after")
    def validate_inputs(self) -> "RecipeRequest":
        has_text = bool(self.recipe_text and self.recipe_text.strip())
        has_url = bool(self.recipe_url and self.recipe_url.strip())

        if not has_text and not has_url:
            raise ValueError("One of recipe_text or recipe_url must be provided and non-empty")

        if has_url and not re.match(r"^https?://.+\..+", self.recipe_url):
            raise ValueError("recipe_url must be a valid URL")

        if has_text and self.source_type is None:
            raise ValueError("source_type is required when recipe_text is provided")

        return self


class Theme(str, Enum):
    dark = "dark"
    light = "light"


class UserPreferenceRequest(BaseModel):
    mode: Theme
