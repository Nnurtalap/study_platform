from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.models.base import Base
from core.types.task_type import TaskType, TaskDifficulty
from .mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .topic import Topic
    from .submission import Submission
    from .user import User

class Task(Base, IntIdPkMixin):
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="RESTRICT"))
    created_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)  # текст вопроса
    task_type: Mapped[TaskType] = mapped_column(
        SAEnum(TaskType, name="task_type")
    )
    difficulty: Mapped[TaskDifficulty] = mapped_column(
        SAEnum(TaskDifficulty, name="task_difficulty"))
    correct_answer: Mapped[str] = mapped_column(Text)  # для choice — id варианта(ов); для open_answer — эталон

    topic: Mapped["Topic"] = relationship(back_populates="tasks")
    submissions: Mapped[List['Submission']] = relationship(back_populates='tasks', cascade='all, delete-orphan')
    created_by: Mapped[Optional["User"]] = relationship()