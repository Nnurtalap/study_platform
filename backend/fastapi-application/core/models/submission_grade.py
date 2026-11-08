from datetime import datetime
from typing import TYPE_CHECKING
from .base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text
if TYPE_CHECKING:
    from .submission import Submission
    

class SubmissionGrade(Base, IntIdPkMixin):
    __table_args__ = (
        CheckConstraint(
            'score >= 0',
            name='score_nonnegative'
        ),
    )
    submission_id: Mapped[int] = mapped_column(
        ForeignKey('submissions.id', ondelete='CASCADE'),
        unique=True
    )
    score: Mapped[int]
    feedback: Mapped[str | None] = mapped_column(Text, default=None)
    graded_by_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete="RESTRICT"))
    graded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    submission: Mapped['Submission'] = relationship(back_populates='grade')