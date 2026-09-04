from typing import List, Optional

from pydantic import BaseModel, ConfigDict

class TestCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TestTaskCreate(BaseModel):
    task_id: int
    position: int
    points: int

class TestTaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    task_id: int
    position: int
    points: int

class TestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    test_tasks: List[TestTaskRead] = []