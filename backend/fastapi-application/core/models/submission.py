'''
id, title, description /
 content, topic (тема, 
 например: Алгебра / Квадратные уравнения), 
 difficulty.'''

from core.models.base import Base
from .mixins.int_id_pk import IntIdPkMixin

from typing import TYPE_CHECKING, List, Optional
from sqlalchemy.orm import Mapped, mapped_column,relationship
from sqlalchemy import Integer, String, ForeignKey, Text
from core.models.base import Base

if TYPE_CHECKING:
    from .task import Task
    from .test_assignment import TestAssignment
    from .analys import AIAnalysis
    from .user import User

class Submission(Base, IntIdPkMixin):
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    answer_text: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default='pending', index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"))
    test_assignment_id: Mapped[int] = mapped_column(
        ForeignKey("test_assignments.id", ondelete="CASCADE")
    )
    tasks: Mapped['Task'] = relationship(back_populates='submissions')
    analys: Mapped[Optional['AIAnalysis']] = relationship(
        back_populates='submissions',
        uselist=False, 
        cascade="all, delete-orphan"
    )
    test_assignment: Mapped["TestAssignment"] = relationship(back_populates="submissions")
    student: Mapped["User"] = relationship()
    