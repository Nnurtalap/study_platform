from pydantic import BaseModel, ConfigDict, model_validator

from core.types.user_id import UserIdType 
from fastapi_users import schemas
from core.models.user import UserRole
from typing import Optional


class UserRead(schemas.BaseUser[int]):
    role: UserRole

class UserCreate(schemas.BaseUserCreate):
    model_config = ConfigDict(extra='forbid')
    @model_validator(mode="before")
    @classmethod
    def only_public_fields(cls, data):
        if isinstance(data, dict):
            forbidden = set(data) - {'email', 'password'}
            if forbidden:
                raise ValueError(
                    "Registration accepts only email and password"
                )
        return data
    
class BootstrapUserCreate(schemas.BaseUserCreate):
    role: UserRole = UserRole.ADMIN
    
class UserUpdate(schemas.BaseUserUpdate):
    role: Optional[UserRole] = None

class UserRegisterNotification(BaseModel):
    user: UserRead
    ts: int 