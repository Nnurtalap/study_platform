from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer

from core.config import settings

from .users import router as users_router
from .auth import router as auth_router
from .group import router as group_router
from .subjects import router as subject_router
from .tasks import router as task_router
from .tests import router as test_router
from .submissions import router as submission_router
http_bearer = HTTPBearer(auto_error=False)

router = APIRouter(
    prefix=settings.api.v1.prefix,
    dependencies=[Depends(http_bearer)]
)
router.include_router(
    users_router,
)

router.include_router(
    auth_router,
)

router.include_router(
    submission_router
)

router.include_router(
    subject_router
)

router.include_router(
    group_router
)
router.include_router(
    task_router
)
router.include_router(
    test_router
)
