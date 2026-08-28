from pydantic import BaseModel

from core.types.user_id import UserIdType 
from fastapi_users import schemas
from core.models.user import UserRole
from typing import Optional

class UserRead(schemas.BaseUser[int]):
    role: UserRole

class UserCreate(schemas.BaseUserCreate):
    role: UserRole = UserRole.STUDENT

class UserUpdate(schemas.BaseUserUpdate):
    role: Optional[UserRole] = None

class UserRegisterNotification(BaseModel):
    user: UserRead
    ts: int