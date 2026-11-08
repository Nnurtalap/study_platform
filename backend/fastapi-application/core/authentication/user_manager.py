import asyncio
import logging

from fastapi import HTTPException
from fastapi_users import BaseUserManager, IntegerIDMixin
from fastapi_users.exceptions import InvalidPasswordException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from core.authentication.code_security import validate_password
from core.models import AssignmentStudent, User
from core.services.email_auth_service import invalidate_credentials
from core.types.user_id import UserIdType


log = logging.getLogger(__name__)

class UserManager(IntegerIDMixin, BaseUserManager[User, UserIdType]):
    async def validate_password(self, password, user):
        try:
            await validate_password(password)
        except HTTPException as exc:
            if exc.status_code != 400:
                raise 

            raise InvalidPasswordException(
                reason=exc.detail
            ) from None

    async def authenticate(self, credentials):
        session = self.user_db.session

        user = await session.scalar(
            select(User)
            .where(func.lower(User.email) == credentials.username.strip().lower())
            .with_for_update()
            .execution_options(populate_existing=True)
        )

        if user is None:
            await asyncio.to_thread(
                self.password_helper.hash,
                credentials.password
                
            )
            return None

        valid, replacement = await asyncio.to_thread(
            self.password_helper.verify_and_update,
            credentials.password,
            user.hashed_password
            
        )

        if not valid:
            return None

        if replacement is not None:
            user.hashed_password = replacement
            await session.flush()

        return user 

    async def update(self, user_update, user, safe=False, request=None):
        fields = user_update.model_fields_set
        allowed = set() if safe else {'role', 'is_active'}

        if fields - allowed:
            raise HTTPException(
                403,
                "Use the dedicated account-security endpoints",
            )

        session = self.user_db.session

        try:
            fresh = await session.scalar(
                select(User)
                .where(User.id == user.id)
                .with_for_update()
                .execution_options(populate_existing=True)
            )

            if fresh is None:
                raise HTTPException(404, "USER_NOT_FOUND")

            if not safe and fresh.is_superuser and fields:
                raise HTTPException(
                    403,
                    "Superuser accounts require separate management",
                )

            for filed in fields:
                setattr(fresh, filed, getattr(user_update, filed))

            if fields:
                await invalidate_credentials(session, fresh)

            await session.commit()
            await session.refresh(fresh)

            return fresh 

        except Exception:
            await session.rollback()
            raise

    async def on_after_register(self, user, request=None):
        log.info("User created id=%s", user.id)

    async def request_verify(self, *args, **kwargs):
        raise HTTPException(410, "Use email codes")

    async def verify(self, *args, **kwargs):
        raise HTTPException(410, "Use email codes")

    async def forgot_password(self, *args, **kwargs):
        raise HTTPException(410, "Use email codes")

    async def reset_password(self, *args, **kwargs):
        raise HTTPException(410, "Use email codes")

    async def delete(self, user: User, request=None) -> None:
        session = self.user_db.session

        participant_id = await session.scalar(
            select(AssignmentStudent.id)
            .where(AssignmentStudent.student_id == user.id)
            .limit(1)
        )

        if participant_id is not None:
            raise HTTPException(
                    409,
                    "User has assignment history. "
                    "Deactivate the account instead.",
                )

        try: 
            await super().delete(user, request=request)
        except IntegrityError as exc:
            await session.rollback()

            sqlstate = (
                getattr(exc.orig, 'sqlstate', None)
                or getattr(exc.orig, 'pgcode', None)
            )

            if sqlstate != '23503':
                raise 

            raise HTTPException(
                409,
                "User has related records. "
                "Deactivate the account instead.",
            ) from exc
