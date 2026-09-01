from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import ForeignKey, DateTime, CheckConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.models.base import Base
from core.types.assignment_status import AssignmentStatus
from .mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .test import Test
    from .user import User
    from .group import Group
    from .submission import Submission



class TestAssignment(IntIdPkMixin, Base):
    __table_args__ = (
        CheckConstraint(
            "(student_id IS NOT NULL) != (group_id IS NOT NULL)",
            name="ck_test_assignment_target_xor",
        ),
    )

    test_id: Mapped[int] = mapped_column(ForeignKey("tests.id", ondelete="CASCADE"))
    assigned_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))

    student_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    group_id: Mapped[int | None] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)

    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[AssignmentStatus] = mapped_column(
        SAEnum(AssignmentStatus, name="assignment_status"),
        default=AssignmentStatus.ASSIGNED,
    )

    test: Mapped["Test"] = relationship(back_populates="assignments")
    assigned_by: Mapped['User'] = relationship(foreign_keys=[assigned_by_id])
    student: Mapped['User'] = relationship(foreign_keys=[student_id])
    group: Mapped[Optional["Group"]] = relationship(back_populates="assignments")
    submissions: Mapped[List["Submission"]] = relationship(back_populates="test_assignment")
