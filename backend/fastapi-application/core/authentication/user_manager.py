import logging
from typing import TYPE_CHECKING, Optional
from fastapi import HTTPException
from fastapi_users.exceptions import InvalidPasswordException

from core.types.user_id import UserIdType
from fastapi_users import BaseUserManager, IntegerIDMixin

from core.models import User
from core.config import settings
if TYPE_CHECKING:
    from fastapi import Request

log = logging.getLogger(__name__)

class UserManager(IntegerIDMixin, BaseUserManager[User, UserIdType]):
    reset_password_token_secret = settings.access_token.reset_password_token_secret
    verification_token_secret =  settings.access_token.verification_token_secret
    
    async def on_after_register(
        self,
        user,
        request=None,
    ):
        log.info(
            "User registered",
            extra={"user_id": user.id},
        )
    async def on_after_forgot_password(
        self, 
        user: User, 
        token: str,
        request: Optional['Request'] = None
    ):
        log.warning(
            "User %r has forgot their password. Reset token: %r",
            user.id,
            token,
        )
    async def on_after_request_verify(
        self, 
        user: User, 
        token: str,
        request: Optional['Request'] = None
    ):
        log.warning(
            "Verification requested for user %r. Verification token: %r",
            user.id,
            token,
        )

    async def validate_password(self, password, user):
         if not 12 <= len(password) <= 128:
              raise InvalidPasswordException(
                reason="Password must contain 12 to 128 characters"
            )

    async def update(
              self, 
              user_update, 
              user, 
              safe=False,
              request=None
    ):
        supplied_fields = user_update.model_fields_set
        if safe:
            allowed_fields = {'email', 'password'}
        else:
            allowed_fields = {'role', 'is_active'}

        if supplied_fields - allowed_fields:
            raise HTTPException(
                status_code=403,
                detail="These fields cannot be changed here",
            )

        if not safe and user.is_superuser and supplied_fields:
            raise HTTPException(
                status_code=403,
                detail="Superuser accounts require separate management",
            )

        return await super().update(
             user_update,
             user,
             safe,
             request
        )
