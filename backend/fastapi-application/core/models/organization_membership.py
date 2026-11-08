from models.base import Base
from models.mixins.int_id_pk import IntIdPkMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, UniqueConstraint, func, ForeignKey, Enum as SAEnum
from datetime import datetime
from types.organization_role import OrganizationRole
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .organization import Organization
    from .user import User

from organization import Organization
class OrganizationMembership(Base, IntIdPkMixin):
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id', ondelete='CASCADE'))
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'))
    role: Mapped[OrganizationRole] = mapped_column(
        SAEnum(
            OrganizationRole,
            name ='organization_role_enum',
            values_callable = lambda enum_cls: [
                item.value for item in enum_cls
            ]
        )
    )
    is_active: Mapped[bool] = mapped_column(default=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization: Mapped["Organization"] = relationship(
        back_populates="memberships"
    )
    user: Mapped["User"] = relationship()
    __table_args__ = (
        UniqueConstraint(
            'user_id',
            'organization_id',
            name="uq_user_organization",
        ),
    )