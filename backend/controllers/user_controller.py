from fastapi import APIRouter, Depends

from auth import get_current_user_id
from models.request import UserPreferenceRequest
from services.user_service import UserService

router = APIRouter(prefix="/users")


def get_user_service() -> UserService:
    return UserService()


@router.put("/preferences", status_code=200)
async def update_preferences(
    request: UserPreferenceRequest,
    user_id: str = Depends(get_current_user_id),
    service: UserService = Depends(get_user_service),
):
    await service.update_preferences(user_id, request)