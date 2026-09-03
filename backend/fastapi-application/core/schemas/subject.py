from pydantic import BaseModel, ConfigDict

class SubjectCreate(BaseModel):
    name: str
    slug: str

class SubjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str

class TopicCreate(BaseModel):
    topic: str

class TopicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    subject_id: int

