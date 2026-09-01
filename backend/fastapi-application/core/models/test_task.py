from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.models.base import Base
from .mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .test import Test
    from .task import Task

class TestTask(IntIdPkMixin, Base):
    __table_args__ = (UniqueConstraint("test_id", "task_id", name="uq_test_task"),)

    test_id: Mapped[int] = mapped_column(ForeignKey("tests.id", ondelete="CASCADE"))
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id", ondelete="RESTRICT"))
    position: Mapped[int]
    points: Mapped[int]      

    test: Mapped["Test"] = relationship(back_populates="tasks")
    task: Mapped["Task"] = relationship()