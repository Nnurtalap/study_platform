from typing import List 
from pydantic import BaseModel, ConfigDict, EmailStr

class GroupCreate(BaseModel):
    name: str

class EnrolmentCreate(BaseModel):
    student_email: EmailStr

class StudentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str

class GroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str

class GroupWithStudentsRead(BaseModel):
    id: int
    name: str
    students: List[StudentRead]