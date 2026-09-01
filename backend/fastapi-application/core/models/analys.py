from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Text, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.models.base import Base
from .mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .submission import Submission

class AIAnalysis(Base, IntIdPkMixin):
    __tablename__ = "ai_analyses"
    score: Mapped[int] = mapped_column(Integer)  
    feedback: Mapped[str] = mapped_column(Text)   
    
    weak_topics: Mapped[list[str]] = mapped_column(JSON, default=list)

    submission_id: Mapped[int] = mapped_column(ForeignKey("submissions.id", ondelete="CASCADE"), unique=True)
    submissions: Mapped['Submission'] = relationship(back_populates='analys')