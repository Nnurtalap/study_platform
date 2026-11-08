from datetime import datetime

from pydantic import BaseModel, Field

from core.types.assignment_status import AssignmentStatus
from core.types.task_type import TaskDifficulty, TaskType

class StudentAssignmentRead(BaseModel):
    id: int
    test_id: int
    student_id: int
    group_id: int | None
    due_date: datetime | None
    status: AssignmentStatus
    can_submit: bool

class StudentTaskRead(BaseModel):
    id: int
    title: str
    body: str
    task_type: TaskType
    difficulty: TaskDifficulty
    position: int
    points: int
    submission_id: int | None = None

class StudentAssignmentDetail(StudentAssignmentRead):
    title: str
    description: str | None
    tasks: list[StudentTaskRead]

class StudentAssignmentResult(BaseModel):
    total_tasks: int = Field(ge=0)
    submitted_tasks: int = Field(ge=0)
    graded_tasks: int = Field(ge=0)
    max_points: int = Field(ge=0)
    earned_points: int = Field(ge=0)
    is_fully_graded: bool 

class TeacherStudentAssignmentResult(StudentAssignmentResult):
    student_id: int = Field(gt=0)