from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi_users.authentication.strategy.db import DatabaseStrategy
from sqlalchemy import select

from core.config import settings
from core.models import User

from .access_token import get_access_token_db

class LocalDatabaseStrategy(DatabaseStrategy):
    async def write_token(self, user):
        old_hash = user.hashed_password
        old_email = user.email

        session = self.database.session

        fresh = await session.scalar(
            select(User)
            .where(User.id == user.id)
            .with_for_update()
            .execution_options(populate_existing=True)
        )

        if (
            fresh is None
            or not fresh.is_active
            or not fresh.is_verified
            or fresh.hashed_password != old_hash
            or fresh.email != old_email
        ):
            await session.rollback()

            raise HTTPException(
                401,
                "AUTHENTICATION_REQUIRED",
            )

        return await super().write_token(fresh)

def get_database_strategy(
        access_token_db: Annotated[
            object, 
            Depends(get_access_token_db)
        ]
):
    return LocalDatabaseStrategy(
        database=access_token_db, 
        lifetime_seconds=settings.access_token.lifetime_seconds
    )