from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base

class EmailChallenge(Base):
    __tablename__ = "email_challenges"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True, 
        default=uuid4,
    )

    slot: Mapped[str] = mapped_column(String(64), unique=True)
    purpose: Mapped[str] = mapped_column(String(24))
    email: Mapped[str] = mapped_column(String(320))

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    credential_tag: Mapped[str | None] = mapped_column(String(64))
    code_digest: Mapped[str] = mapped_column(String(64))

    generation: Mapped[int] = mapped_column(Integer, default=1)
    attempts: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )
    consumed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

class EmailOutbox(Base):
    __tablename__ = "email_outbox"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )

    challenge_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("email_challenges.id", ondelete="CASCADE"),
        index=True,
    )
    generation: Mapped[int | None] = mapped_column(Integer)

    encrypted_payload: Mapped[str | None] = mapped_column(Text)

    state: Mapped[str] = mapped_column(String(16), default="pending")
    attempts: Mapped[int] = mapped_column(Integer, default=0)

    available_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
    )
    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    error_code: Mapped[str | None] = mapped_column(String(64))

class AuthRateBucket(Base):
    __tablename__ = "auth_rate_buckets"

    key: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
    )
    window: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    count: Mapped[int] = mapped_column(Integer)

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )