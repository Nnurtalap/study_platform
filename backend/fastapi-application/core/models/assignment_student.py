from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from core.models.base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin
from core.types.assignment_status import AssignmentStatus


class AssignmentStudent(IntIdPkMixin, Base):
    __table_args__ = (
        UniqueConstraint(
            "assignment_id",
            "student_id",
            name="uq_assignment_student",
        ),
    )

    assignment_id: Mapped[int] = mapped_column(
        ForeignKey("test_assignments.id", ondelete="CASCADE")
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT")
    )

    status: Mapped[AssignmentStatus] = mapped_column(
        SAEnum(
            AssignmentStatus,
            name="assignment_status",
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
        ),
        default=AssignmentStatus.ASSIGNED,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )