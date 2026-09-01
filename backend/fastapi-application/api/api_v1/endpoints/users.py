from fastapi import (
    APIRouter,
)
from core.authentication.fastapi_users import fastapi_users

from core.schemas.user import (
    UserRead,
    UserUpdate
)
from crud import users as users_crud
from core.config import settings
router = APIRouter(prefix = settings.api.v1.users ,tags=["Users"])

router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate)
)
router.include_router(
    fastapi_users.get_verify_router(UserRead)
) 