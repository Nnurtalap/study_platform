from pydantic import BaseModel, ConfigDict

from core.types.task_type import TaskType, TaskDifficulty

class TaskCreate(BaseModel):
    title: str
    body: str
    task_type: TaskType
    difficulty: TaskDifficulty
    topic_id: int
    correct_answer: str

class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    body: str
    task_type: TaskType
    difficulty: TaskDifficulty
    topic_id: int
    correct_answer: str
