from datetime import datetime 
from typing import Optional, Self
from pydantic import BaseModel, ConfigDict, model_validator
from core.types.assignment_status import AssignmentStatus

class TestAssigmentCreate(BaseModel):
    student_id: Optional[int] = None
    group_id: Optional[int] = None
    due_date: Optional[datetime] = None

    @model_validator(mode='after')
    def check_single_target(self) -> Self:
        if (self.student_id is None) == (self.group_id is None):
            raise ValueError("Specify exactly one of student_id or group_id")
        return self 

class TestAssigmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    test_id: int
    student_id: Optional[int]
    group_id: Optional[int]
    due_date: Optional[datetime]
    status: AssignmentStatus

 
     