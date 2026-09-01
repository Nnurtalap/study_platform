# enrollment.py
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models.base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .user import User
    from .group import Group

class Enrollment(IntIdPkMixin, Base):
    __table_args__ = (UniqueConstraint("student_id", "group_id", name="uq_enrollment_student_group"),)

    student_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"))
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    student: Mapped['User'] = relationship()
    group: Mapped["Group"] = relationship(back_populates="enrollments")