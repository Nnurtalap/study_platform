from datetime import datetime
from typing import TYPE_CHECKING, List
from sqlalchemy import String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models.base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .user import User
    from .test_task import TestTask
    from .test_assignment import TestAssignment

class Test(IntIdPkMixin, Base):
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    created_by: Mapped["User"] = relationship()
    tasks: Mapped[list["TestTask"]] = relationship(back_populates="test", order_by="TestTask.position")
    assignments: Mapped[List["TestAssignment"]] = relationship(
        back_populates="test", cascade="all, delete-orphan"
    )