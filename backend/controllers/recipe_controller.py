from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from auth import get_current_user_id
from models.domain import Recipe
from models.request import RecipeRequest, SourceType
from models.response import Ingredient, PaginatedRecipeResponse, RecipeResponse, RecipeStep, Unit
from services.pdf_text_service import extract_text_from_pdf
from services.recipe_service import RecipeService

router = APIRouter(prefix="/recipe")


def get_recipe_service() -> RecipeService:
    return RecipeService()


def _to_response(recipe: Recipe) -> RecipeResponse:
    return RecipeResponse(
        id=recipe.id,
        name=recipe.name,
        cooking_time=recipe.cooking_time,
        ingredients=[Ingredient(name=i.name, quantity=i.quantity, unit=Unit(i.unit)) for i in recipe.ingredients],
        recipe_steps=[RecipeStep(step=s.step, time=s.time) for s in recipe.steps],
    )


@router.get("/{recipe_id}", response_model=RecipeResponse)
async def get_recipe(
    recipe_id: str,
    user_id: str = Depends(get_current_user_id),
    service: RecipeService = Depends(get_recipe_service),
):
    recipe = await service.get_by_id(recipe_id, user_id)
    if recipe is None:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _to_response(recipe)


@router.get("", response_model=PaginatedRecipeResponse)
async def list_recipes(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    service: RecipeService = Depends(get_recipe_service),
):
    recipes, total = await service.list_recipes(user_id=user_id, page=page, limit=limit, offset=offset)
    return PaginatedRecipeResponse(
        recipes=[_to_response(r) for r in recipes],
        page=page,
        limit=limit,
        offset=offset,
        total=total,
    )


@router.delete("/{recipe_id}", status_code=204)
async def delete_recipe(
    recipe_id: str,
    user_id: str = Depends(get_current_user_id),
    service: RecipeService = Depends(get_recipe_service),
):
    deleted = await service.delete_recipe(recipe_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe not found")


@router.post("", response_model=RecipeResponse, status_code=200)
async def create_recipe(
    request: RecipeRequest,
    user_id: str = Depends(get_current_user_id),
    service: RecipeService = Depends(get_recipe_service),
):
    recipe = await service.create_recipe(user_id, request)
    return _to_response(recipe)


@router.post("/pdf", response_model=RecipeResponse, status_code=200)
async def create_recipe_from_pdf(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    service: RecipeService = Depends(get_recipe_service),
):
    pdf_bytes = await file.read()
    text = await extract_text_from_pdf(pdf_bytes, file.filename or "recipe.pdf")
    if not text.strip():
        raise HTTPException(status_code=422, detail="No text could be extracted from the PDF")
    request = RecipeRequest(recipe_text=text, source_type=SourceType.pdf)
    recipe = await service.create_recipe(user_id, request)
    return _to_response(recipe)