from pydantic import BaseModel, ConfigDict

from core.types.task_type import TaskType, TaskDifficulty
from typing import Literal
from pydantic import Field 

class TaskCreate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True, 
        extra='forbid'
    )
    title: str = Field(min_length=1, max_length=255)
    body: str = Field(min_length=1)
    task_type: Literal[TaskType.OPEN_ANSWER]
    difficulty: TaskDifficulty
    topic_id: int = Field(gt=0)
    correct_answer: str = Field(min_length=1)
 
class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    body: str
    task_type: TaskType
    difficulty: TaskDifficulty
    topic_id: int
    correct_answer: str
