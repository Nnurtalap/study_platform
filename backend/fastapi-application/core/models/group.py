# group.py
from typing import TYPE_CHECKING, List

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models.base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .user import User
    from .enrollment import Enrollment
    from .test_assignment import TestAssignment

class Group(IntIdPkMixin, Base):
    name: Mapped[str] = mapped_column(String(150))
    teacher_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    enrollments: Mapped[List["Enrollment"]] = relationship(back_populates="group",  cascade="all, delete-orphan")
    assignments: Mapped[List["TestAssignment"]] = relationship(back_populates="group")