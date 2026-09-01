from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from core.types.submission_status import SubmissionStatus


class SubmissionCreate(BaseModel):
    task_id: int
    answer_text: str

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