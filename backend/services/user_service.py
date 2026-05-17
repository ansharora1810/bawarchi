from dao.user_dao import UserDao
from models.request import UserPreferenceRequest


class UserService:
    def __init__(self):
        self._dao = UserDao.get_instance()

    async def update_preferences(self, user_id: str, request: UserPreferenceRequest) -> None:
        await self._dao.update_preferences(user_id, request.model_dump())