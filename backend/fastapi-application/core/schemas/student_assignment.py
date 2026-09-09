from datetime import datetime

from pydantic import BaseModel

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
