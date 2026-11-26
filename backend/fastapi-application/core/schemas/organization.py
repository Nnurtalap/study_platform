from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Literal
from datetime import datetime
from core.types.organization_role import OrganizationRole
class OrganizationCreate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True, 
        extra='forbid'
    )
    name: str = Field(min_length=1, max_length=150)

class OrganizationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    is_active: bool
    created_at: datetime

class MyOrganizationRead(OrganizationRead):
    role: OrganizationRole

class OrganizationMemberRead(BaseModel):
    id: int
    email: EmailStr
    role: OrganizationRole
    user_id: int 
    is_active: bool
    joined_at: datetime

class OrganizationMemberCreate(BaseModel):
    model_config = ConfigDict(
        extra='forbid'
    )
    user_id: int = Field(gt=0)
    role: Literal['teacher', 'student']

class OrganizationMemberStatusUpdate(BaseModel):
    model_config = ConfigDict(
        extra='forbid'
    )
    is_active: bool 

class OrganizationMemberRoleUpdate(BaseModel):
    model_config=ConfigDict(
        extra='forbid'
    )
    role: Literal['admin', 'teacher', 'student']
    