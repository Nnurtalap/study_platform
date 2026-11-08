from datetime import datetime 
from typing import Optional, Self
from pydantic import BaseModel, ConfigDict, model_validator, Field
from core.types.assignment_status import AssignmentStatus
from pydantic import AwareDatetime

class TestAssignmentCreate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    student_id: Optional[int] = Field(default=None, gt=0)
    group_id: Optional[int] = Field(default=None, gt=0)
    due_date: AwareDatetime | None = None

    @model_validator(mode='after')
    def check_single_target(self) -> Self:
        if (self.student_id is None) == (self.group_id is None):
            raise ValueError("Specify exactly one of student_id or group_id")
        return self 

class TestAssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    test_id: int
    student_id: Optional[int]
    group_id: Optional[int]
    due_date: Optional[datetime]

 
     