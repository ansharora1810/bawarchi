import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from controllers.recipe_controller import router as recipe_router
from controllers.user_controller import router as user_router
from dao.database_adapter import PostgresAdapter
from dao.recipe_dao import RecipeDao
from dao.user_dao import UserDao
from services.extraction_service import AnthropicAdapter, ExtractionService, GeminiAdapter

adapter = PostgresAdapter(dsn=os.environ["DATABASE_URL"])
RecipeDao.get_instance(adapter)
UserDao.get_instance(adapter)
ExtractionService.get_instance(GeminiAdapter(api_key=os.environ["GEMINI_API_KEY"]))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await adapter.connect()
    yield
    await adapter.close()


app = FastAPI(lifespan=lifespan)

app.include_router(recipe_router, prefix="/api")
app.include_router(user_router, prefix="/api")