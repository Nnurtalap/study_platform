from typing import List 
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime

class GroupCreate(BaseModel):
    model_config = ConfigDict(
            str_strip_whitespace=True,
            extra='forbid',
        )
    name: str = Field(min_length=1, max_length=150)

class EnrollmentCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    student_email: EmailStr

class StudentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str

class GroupRead(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
            )
    id: int
    name: str 
    
class GroupWithStudentsRead(BaseModel):
    id: int
    name: str
    students: List[StudentRead]

class OrganizationGroupCreate(GroupCreate):
    teacher_id: int = Field(gt=0)

class OrganizationGroupRead(GroupRead):
    teacher_id: int
    organization_id: int 

class OrganizationEnnrolmentCreate(BaseModel):
    model_config = ConfigDict(
        extra = 'forbid'
    )
    student_id: int = Field(gt=0)

class EnrollmentRead(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )
    id: int
    group_id: int
    student_id: int 
    joined_at: datetime