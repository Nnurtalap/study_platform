from contextlib import asynccontextmanager
import logging
from api.webhooks import webhook_router
import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from core.authentication.request_guard import AuthRequestGuard
from fastapi.middleware.cors import CORSMiddleware  

from core.config import settings

from api import router as api_router
from core.models import db_helper
from core.authentication.code_settings import code_settings
logging.basicConfig(
    level=settings.logging.log_level_value,
    format=settings.logging.log_format,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    yield
    # shutdown
    await db_helper.dispose()


main_app = FastAPI(
    lifespan=lifespan,
    webhooks=webhook_router,
)

api_v1_prefix = settings.api.prefix + settings.api.v1.prefix

main_app.add_middleware(
    AuthRequestGuard,
    prefixes=(
        api_v1_prefix + settings.api.v1.auth,
        api_v1_prefix + settings.api.v1.users,
    ),
)

main_app.add_middleware(                             
    CORSMiddleware,
    allow_origins=[str(code_settings.public_origin).rstrip("/")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

main_app.include_router(
    api_router,
)

@main_app.exception_handler(RequestValidationError)
async def validation_error(
    request: Request,
    exc: RequestValidationError,
):
    errors = [
        {
            "loc": error["loc"],
            "msg": error["msg"],
            "type": error["type"],
        }
        for error in exc.errors()
    ]

    return JSONResponse(
        status_code=422,
        content={"detail": errors},
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:main_app",
        host=settings.run.host,
        port=settings.run.port,
        reload=True,
    )