from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

from core.types.submission_status import SubmissionStatus


class SubmissionCreate(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    task_id: int = Field(gt=0)
    answer_text: str = Field(min_length=1, max_length=20000)

class AIAnalysRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    score: int
    feedback: str
    weak_topics: List[str]

class SubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    test_assignment_id: int
    answer_text: str
    status: SubmissionStatus
    analys: Optional[AIAnalysRead] = None