from typing import TYPE_CHECKING

from sqlalchemy import Enum, UniqueConstraint
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable, SQLAlchemyUserDatabase

from .base import Base
from .mixins.int_id_pk import IntIdPkMixin
from core.types.user_id import UserIdType


if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class User(Base, IntIdPkMixin,SQLAlchemyBaseUserTable[UserIdType]):
    
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name='user_role_enum'),
        default=UserRole.STUDENT,
        nullable=False
    )
    @classmethod 
    def get_db(cls, session: 'AsyncSession'):
        return SQLAlchemyUserDatabase(session, User)

