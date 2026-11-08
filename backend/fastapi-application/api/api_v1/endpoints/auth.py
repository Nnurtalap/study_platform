from fastapi import APIRouter, Depends, Response

from api.api_v1.dependencies.authentification.backend import (
    authentication_backend,
)
from core.authentication.code_limits import ip_limit, login_limit
from core.config import settings
from core.models import User
from core.schemas.email_auth import (
    Accepted,
    CodePassword,
    EmailChange,
    EmailChangeConfirm,
    EmailRequest,
    PasswordChange,
)
from core.services import email_auth_service as service

from core.authentication.fastapi_users import (
    current_active_user,
    fastapi_users,
)


router = APIRouter(
    prefix=settings.api.v1.auth,
    tags=['Auth'],
    dependencies=[Depends(ip_limit)]
)
 
router.include_router(
    router=fastapi_users.get_auth_router(
            authentication_backend,
            requires_verification=True
    ),
    dependencies=[Depends(login_limit)]
)

@router.post(
    '/register',
    response_model=Accepted,
    status_code=202
)
async def register(data: EmailRequest) -> Accepted:
    await service.request_code('register', str(data.email))

    return Accepted()

@router.post(
    '/verify-email',
    response_class=Response, 
    status_code=204
)
async def verify_email(data: CodePassword) -> Response:
    await service.confirm_password_code(
        'register',
        str(data.email),
        data.code, 
        data.password.get_secret_value()
    )

    return Response(status_code=204)

@router.post(
    '/forgot-password',
    response_model=Accepted, 
    status_code=202
)
async def forgot_password(data: EmailRequest) -> Accepted:
    await service.request_code(
        'reset',
        str(data.email)
    )
    return Accepted()

@router.post(
    '/reset-password',
    response_class=Response, 
    status_code=204
)
async def reset_password(data: CodePassword) -> Response:
    await service.confirm_password_code(
        "reset",
        str(data.email),
        data.code,
        data.password.get_secret_value(),
    )
    return Response(status_code=204)

@router.post(
    '/change-password',
    status_code=204, 
    response_class=Response
)
async def change_password(
    data: PasswordChange, 
    user: User = Depends(current_active_user)
) -> Response: 
    await service.change_password(
        user, 
        data.current_password.get_secret_value(), 
        data.password.get_secret_value()
    )

    return Response(status_code=204)

@router.post(
    '/change-email/request',
    response_model=Accepted,
    status_code=202,
)
async def request_email_change(
    data: EmailChange,
    user: User = Depends(current_active_user)
) -> Accepted:
    await service.request_email_change(
        user,
        str(data.email),
        data.current_password.get_secret_value()
    )
    return Accepted()

@router.post(
    "/change-email/confirm",
    status_code=204, 
    response_class=Response
)
async def confirm_email_change(
    data: EmailChangeConfirm,
    user: User = Depends(current_active_user)
) -> Response:
    await service.confirm_email_change(
        user, 
        str(data.email),
        data.code, 
        data.current_password.get_secret_value()
    )
    return Response(status_code=204)