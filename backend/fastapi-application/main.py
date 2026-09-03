from contextlib import asynccontextmanager
import logging
from api.webhooks import webhook_router
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware   # ← добавили
from fastapi.responses import ORJSONResponse

from core.config import settings

from api import router as api_router
from core.models import db_helper
from actions.create_superuser import create_superuser
from core.schemas.user import UserRegisterNotification

logging.basicConfig(
    level=settings.logging.log_level_value,
    format=settings.logging.log_format,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_superuser()
    # startup
    yield
    # shutdown
    await db_helper.dispose()


main_app = FastAPI(
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
    webhooks=webhook_router,
)

main_app.add_middleware(                              # ← добавили
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

main_app.include_router(
    api_router,
)


if __name__ == "__main__":
    uvicorn.run(
        "main:main_app",
        host=settings.run.host,
        port=settings.run.port,
        reload=True,
    )