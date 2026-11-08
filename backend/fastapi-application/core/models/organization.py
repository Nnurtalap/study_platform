from models.base import Base
from models.mixins.int_id_pk import IntIdPkMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, func
from datetime import datetime
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from organization_membership import OrganizationMembership

class Organization(Base, IntIdPkMixin):
    name: Mapped[str] = mapped_column(String(150))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_by: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    memberships: Mapped['OrganizationMembership'] = relationship(back_populates='organization', cascade='all, delete-orphan')