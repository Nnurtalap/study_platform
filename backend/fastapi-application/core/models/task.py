'''
id, title, description /
 content, topic (тема, 
 например: Алгебра / Квадратные уравнения), 
 difficulty.'''

from typing import TYPE_CHECKING, List

from core.models.base import Base
from .mixins.int_id_pk import IntIdPkMixin


from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, ForeignKey

if TYPE_CHECKING:
    from .submission import Submission

class Task(Base, IntIdPkMixin):

    title: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(String(200))
    topic: Mapped[str] = mapped_column(String(50), index=True)

    created_by_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'))

    submissions: Mapped[List['Submission']] = relationship(back_populates='tasks', cascade='all, delete-orphan')