from typing import TYPE_CHECKING, List

from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models.base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .subjects import Subject
    from .task import Task

class Topic(IntIdPkMixin, Base):
    __table_args__ = (UniqueConstraint("subject_id", "name", name="uq_topic_subject_name"),)

    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(150))

    subject: Mapped["Subject"] = relationship(back_populates="topics")
    tasks: Mapped[List["Task"]] = relationship(back_populates="topic")