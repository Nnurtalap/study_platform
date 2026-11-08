from pydantic import BaseModel, ConfigDict, Field

class SubjectCreate(BaseModel):
    model_config = ConfigDict(
                str_strip_whitespace=True,
                extra='forbid',
            )
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=100)

class SubjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str

class TopicCreate(BaseModel):
    model_config = ConfigDict(
            str_strip_whitespace=True,
            extra='forbid',
        )
    topic: str = Field(min_length=1, max_length=150)

class TopicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    subject_id: int

