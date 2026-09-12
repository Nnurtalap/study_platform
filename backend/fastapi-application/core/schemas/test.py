from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TestTaskCreate(BaseModel):
    task_id: int = Field(gt=0)
    position: int = Field(gt=0)
    points: int = Field(gt=0)

class TestTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    task_id: int
    position: int
    points: int

class TestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None = None
    test_tasks: List[TestTaskRead] = Field(
        default_factory=list,
        validation_alias="tasks",
    )