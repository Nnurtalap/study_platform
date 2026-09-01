from typing import TYPE_CHECKING, List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models.base import Base
from core.models.mixins.int_id_pk import IntIdPkMixin

if TYPE_CHECKING:
    from .topic import Topic
    
class Subject(IntIdPkMixin, Base):
    name: Mapped[str] = mapped_column(String(100), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    topics: Mapped[List["Topic"]] = relationship(
        back_populates="subject",
        cascade='all, delete-orphan'
    )