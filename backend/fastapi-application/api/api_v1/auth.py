from fastapi import (
    APIRouter,
    Depends,
)
from api.api_v1.dependancies.authentification.backend import authentication_backend

from core.config import settings
from core.schemas.user import UserRead, UserCreate
from core.auntification.fastapi_users import fastapi_users
router = APIRouter(
    prefix=settings.api.v1.auth,
    tags=['Auth']
)
 
router.include_router(
    router=fastapi_users.get_auth_router(
            authentication_backend,
            requires_verification=True
    )
)

router.include_router(
    router=fastapi_users.get_register_router(
        UserRead, UserCreate
    )
)

router.include_router(
    router=fastapi_users.get_reset_password_router()
)

