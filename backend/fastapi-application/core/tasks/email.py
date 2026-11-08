from celery.utils.log import get_task_logger
from core.celery_app import celery_app
import time 
import asyncio
from datetime import timedelta

from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool
from sqlalchemy import delete, select, update

from core.config import settings
from core.authentication.code_security import decrypt, utcnow
from core.models.email_auth import EmailChallenge, EmailOutbox, AuthRateBucket
import secrets
import smtplib
from uuid import UUID

from billiard.exceptions import SoftTimeLimitExceeded
from cryptography.fernet import InvalidToken
from jinja2 import TemplateError
from sqlalchemy.exc import SQLAlchemyError

from core.services.smtp_service import send_message

logger = get_task_logger(__name__)


async def with_database(operation, *args):
    engine = create_async_engine(
        str(settings.db.url),
        poolclass=NullPool
    )

    factory = async_sessionmaker(
        engine, 
        expire_on_commit=False
    )

    try:
        return await operation(factory, *args)
    finally:
        await engine.dispose()

def close_mail(
    row: EmailOutbox,
    state: str,
    error: str | None = None,
) -> None:
    row.state = state
    row.error_code = error
    row.encrypted_payload = None

async def dispatch(factory) -> None:
    for _ in range(50):
        async with factory.begin() as session:
            now = utcnow()

            row = await session.scalar(
                select(EmailOutbox)
                .where(
                    EmailOutbox.state.in_(['pending', 'queued']),
                    EmailOutbox.available_at <= now
                )
                .order_by(EmailOutbox.available_at)
                .limit(1)
                .with_for_update(skip_locked=True)
            )

            if row is None:
                return 

            if row.expires_at <= now:
                close_mail(row, 'expired')
                continue

            try:
                celery_app.send_task(
                    'email.send',
                    args=[str(row.id)],
                    queue='email',
                    expires=120,
                    retry=False
                )

            except Exception:
                logger.error("email_broker_publish_failed")

                raise RuntimeError(
                    "Email broker unavailable"
                ) from None

            row.state='queued'
            row.available_at = now + timedelta(seconds=120)


@celery_app.task(name='email.dispatch')
def dispatch_outbox() -> None:
    asyncio.run(with_database(dispatch)) 

async def deliver(factory, outbox_id: str) -> None:
    async with factory.begin() as session:
        row = await session.scalar(
            select(EmailOutbox)
            .where(EmailOutbox.id == UUID(outbox_id))
            .with_for_update()
        )

        if row is None or row.state not in {'pending', 'queued'}:
            return 

        if row.state == 'pending' and row.available_at > utcnow():
            return 

        if row.expires_at <= utcnow():
            close_mail(row, 'expired')
            return 

        if row.challenge_id is not None:
            challenge = await session.get(
                EmailChallenge, 
                row.challenge_id
            )

            if (
                challenge is None
                or challenge.consumed_at is not None
                or challenge.generation != row.generation
                or challenge.expires_at <= utcnow()
            ):
                close_mail(row, 'cancelled')
                return 

        row.attempts += 1

        try:
            if row.encrypted_payload is None:
                raise ValueError("Missing mail payload")

            payload = decrypt(row.encrypted_payload)

            send_message(payload, str(row.id))

        except (InvalidToken, TemplateError, ValueError, KeyError):
            close_mail(
                row, 
                'failed',
                "MAIL_PAYLOAD_INVALID",
            )
            logger.error(
                "email_payload_failed id=%s",
                row.id,
            )

        except (
            OSError, 
            smtplib.SMTPException,
            SoftTimeLimitExceeded,
        ) as exc:
            permament = (
                isinstance(exc, smtplib.SMTPRecipientsRefused)
                and all(
                    500 <= reply[0] < 600
                    for reply in exc.recipients.values()
                ) or (
                    isinstance(exc, smtplib.SMTPResponseException)
                    and 500 <= exc.smtp_code < 600
                )
            )

            if permament or row.attempts >= 6:
                reason = (
                    'SMTP_PERMANENT'
                    if permament
                    else "SMTP_RETRIES_EXHAUSTED"
                )

                close_mail(row, 'failed', reason)

                logger.error(
                    "email_delivery_failed id=%s reason=%s",
                    row.id,
                    reason,
                )
            else:
                delay = (
                    min(300, 2 ** row.attempts * 5)
                    + secrets.randbelow(5)
                )

                row.state = 'pending'
                row.error_code = "SMTP_TRANSIENT"
                row.available_at = utcnow() + timedelta(
                    seconds=delay
                )
        else:
            close_mail(row, 'sent')
            row.sent_at = utcnow()

@celery_app.task(
    bind=True,
    name='email.send',
    max_retries=3
)
def send(self, outbox_id: str) -> None:
    try:
        asyncio.run(
            with_database(deliver, outbox_id)
        )
    except SQLAlchemyError:
        raise self.retry(
            exc=RuntimeError("Email database unavailable"),
            countdown=15,
        ) from None

async def cleanup(factory) -> None:
    async with factory.begin() as session:
        now = utcnow()
        cutoff = now - timedelta(days=7)

        await session.execute(
            update(EmailOutbox)
            .where(
                EmailOutbox.expires_at <= now,
                EmailOutbox.encrypted_payload.is_not(None)
            )
            .values(
                encrypted_payload=None,
                state='expired',
            )
        )

        await session.execute(
            delete(AuthRateBucket).where(
                AuthRateBucket.expires_at < now
            )
        )

        await session.execute(
            delete(EmailOutbox).where(
                EmailOutbox.expires_at < cutoff
            )
        )

        await session.execute(
            delete(EmailChallenge).where(
                EmailChallenge.expires_at < cutoff
            )
        )

@celery_app.task(name='email.cleanup')
def cleanup_auth() -> None:
    asyncio.run(with_database(cleanup))