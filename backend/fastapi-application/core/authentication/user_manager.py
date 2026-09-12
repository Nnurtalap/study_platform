import logging
from typing import TYPE_CHECKING, Optional
from fastapi import HTTPException
from fastapi_users.exceptions import InvalidPasswordException
from sqlalchemy import delete as sql_delete, select
from sqlalchemy.exc import IntegrityError

from core.models import AccessToken, AssignmentStudent
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

    async def _revoke_access_tokens(self, user_id: int) -> None:
        session = self.user_db.session

        try:
            await session.execute(
                sql_delete(AccessToken).where(
                    AccessToken.user_id == user_id
                )
            )
            await session.commit()
        except Exception:
            await session.rollback()
            raise

    async def on_after_reset_password(
        self,
        user: User,
        request=None,
    ):
        await self._revoke_access_tokens(user.id)

        log.info(
            "Access tokens revoked after password reset",
            extra={"user_id": user.id},
        )

    async def on_after_update(
        self,
        user: User,
        update_dict: dict,
        request=None,
    ):
        password_changed = "password" in update_dict
        account_disabled = update_dict.get("is_active") is False

        if password_changed or account_disabled:
            await self._revoke_access_tokens(user.id)

    async def delete(
        self,
        user: User,
        request=None,
    ) -> None:
        session = self.user_db.session

        participant_id = await session.scalar(
            select(AssignmentStudent.id)
            .where(AssignmentStudent.student_id == user.id)
            .limit(1)
        )

        if participant_id is not None:
            raise HTTPException(
                status_code=409,
                detail=(
                    "User has assignment history. "
                    "Deactivate the account instead."
                ),
            )

        try:
            await super().delete(
                user,
                request=request,
            )
        except IntegrityError as exc:
            await session.rollback()

            sqlstate = (
                getattr(exc.orig, "sqlstate", None)
                or getattr(exc.orig, "pgcode", None)
            )

            if sqlstate != "23503":
                raise

            raise HTTPException(
                status_code=409,
                detail=(
                    "User has related records. "
                    "Deactivate the account instead."
                ),
            ) from exc