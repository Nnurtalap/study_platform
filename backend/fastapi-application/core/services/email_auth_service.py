import hmac
from datetime import timedelta
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.authentication.code_limits import hit, require_limit
from core.authentication.code_security import (
    credential_tag,
    digest,
    encrypt,
    new_code,
    utcnow,
    validate_password,
    hash_password,
    check_current_password,
)
from core.authentication.code_settings import code_settings as cfg
from core.models import User, db_helper, AccessToken
from core.models.email_auth import EmailChallenge, EmailOutbox
from core.models.user import UserRole

INVALID_CODE = "CODE_INVALID_OR_EXPIRED"

def normalize(email: str) -> str:
    return email.strip().lower()

async def lock_emails(
    session: AsyncSession,
    *emails: str,
) -> None:
    keys = sorted(
        {
            int(digest('email-lock', normalize(email))[:15], 16)
            for email in emails
        }
    )

    for key in keys:
        await session.execute(
            select(func.pg_advisory_xact_lock(key))
        )

async def find_user(
        session: AsyncSession, 
        email: str,
        lock: bool = True
) -> User | None:
    statement = select(User).where(
        func.lower(User.email) == normalize(email)
    )

    if lock:
        statement = statement.with_for_update()

    return await session.scalar(
        statement.execution_options(populate_existing=True)
    )

def add_mail(
        session: AsyncSession,
        email: str, 
        kind: str,
        *,
        challenge: EmailChallenge | None = None,
        code: str | None = None
) -> None:
    now = utcnow()

    mail = EmailOutbox(
        id=uuid4(),
        challenge_id=challenge.id if challenge else None,
        generation=challenge.generation if challenge else None,
        encrypted_payload=encrypt(
            {
                "recipient": email,
                "kind": kind, 
                "code": code
            }
        ),
        state="pending",
        attempts=0,
        created_at=now,
        available_at=now,
        expires_at=(
            challenge.expires_at
            if challenge 
            else now + timedelta(days=1)
        )
    )

    session.add(mail)

async def issue(
        session: AsyncSession, 
        purpose: str, 
        email: str,
        user: User | None = None
) -> None:
    email = normalize(email)

    if purpose == "email_change" and user is None:
        raise ValueError("Email change requires a user")

    slot = digest(
        "slot",
        purpose,
        email,
        user.id if purpose == "email_change" else None
    )

    challenge = await session.scalar(
        select(EmailChallenge)
        .where(EmailChallenge.slot == slot)
        .with_for_update()
    )

    now = utcnow()

    if (
        challenge is not None
        and (now - challenge.created_at).total_seconds()
        < cfg.resend_seconds
    ):
        return 

    code = new_code()

    while challenge is not None and hmac.compare_digest(
        challenge.code_digest,
        digest(
            'code',
            str(challenge.id),
            challenge.generation,
            code
        )
    ):
        code = new_code()

    if challenge is None:
        challenge = EmailChallenge(
            id=uuid4(),
            slot=slot,
            generation=0,
        )
        session.add(challenge)

    challenge.generation += 1
    challenge.purpose = purpose
    challenge.email = email
    challenge.user_id = user.id if user else None
    challenge.credential_tag = credential_tag(user) if user else None
    challenge.code_digest = digest(
        "code",
        str(challenge.id),
        challenge.generation,
        code,
    )
    challenge.attempts = 0
    challenge.created_at = now
    challenge.expires_at = now + timedelta(
        seconds=cfg.code_ttl_seconds
    )
    challenge.consumed_at = None

    await session.flush()

    add_mail(
        session,
        email,
        purpose,
        challenge=challenge,
        code=code,
    )

async def request_code(purpose: str, email: str) -> None:
    if purpose not in {"register", "reset"}:
        raise ValueError("Unsupported code purpose")

    email = normalize(email)

    if not await hit(f'mail-address:{email}', 5, 3600): 
        return 

    async with db_helper.session_factory.begin() as session:
        await lock_emails(session, email)

        user = await find_user(session, email)

        eligible = (
            purpose == 'register'
            and (
                user is None
            or (user.is_active and not user.is_verified)
            )
        ) or (
            purpose == "reset"
            and user is not None
            and user.is_active
            and user.is_verified
        )

        if eligible:
            await issue(session, purpose, email, user)

async def invalidate_credentials(
    session: AsyncSession, 
    user: User
) -> None:
    await session.execute(
        delete(AccessToken).where(
            AccessToken.user_id == user.id
        )
    )

    await session.execute(
        update(EmailChallenge)
        .where(
            (
            (EmailChallenge.user_id == user.id)
            | (EmailChallenge.email == normalize(user.email))
            ),
            EmailChallenge.consumed_at.is_(None)
        )
        .values(consumed_at=utcnow())
        
    )

async def consume(
        session: AsyncSession, 
        purpose: str, 
        email: str, 
        code: str, 
        user: User | None = None
) -> bool:
    email = normalize(email)

    if purpose == 'email_change' and user is None:
        raise ValueError("Email change requires a user")

    slot = digest(
        'slot',
        purpose, 
        email, 
        user.id if purpose == 'email_change' else None
    )

    challenge = await session.scalar(
        select(EmailChallenge)
        .where(EmailChallenge.slot == slot)
        .with_for_update()
    )

    now = utcnow()

    if (
        challenge is None
        or challenge.consumed_at is not None
        or challenge.expires_at <= now
        or challenge.attempts >= cfg.max_code_attempts
    ):
        return False

    challenge.attempts += 1

    valid = hmac.compare_digest(
        challenge.code_digest,
        digest(
            'code', 
            str(challenge.id),
            challenge.generation,
            code
        )
    )

    if challenge.user_id is not None:
        if user is None:
            valid = False 
        else: 
            valid = (
                valid
                and challenge.user_id == user.id
                and challenge.credential_tag == credential_tag(user)
            )

    elif user is not None:
        valid = False

    if not valid:
        if challenge.attempts >= cfg.max_code_attempts:
            challenge.consumed_at = now

        return False 

    challenge.consumed_at = now
    return True 

async def confirm_password_code(
        purpose: str, 
        email: str, 
        code: str, 
        password: str
) -> None:
    if purpose not in {"register", "reset"}:
        raise ValueError("Unsupported code purpose")

    email = normalize(email)

    await require_limit(
        key=f"code-confirm:{email}",
        limit=15,
        seconds=600
    )

    await validate_password(password)
    hashed = await hash_password(password)

    success = False

    async with db_helper.session_factory.begin() as session:
        await lock_emails(session, email)

        user = await find_user(session, email)

        eligible = (
            purpose == 'register'
            and (
                user is None
                or (user.is_active and not user.is_verified)
            )
        ) or (
            purpose == 'reset'
            and user is not None
            and user.is_verified
            and user.is_active
        )

        if eligible and await consume(
            session, 
            purpose, 
            email, 
            code, 
            user
        ): 
            if user is None:
                user = User(
                    email=email,
                    hashed_password=hashed,
                    role=UserRole.STUDENT,
                    is_active=True,
                    is_superuser=False,
                    is_verified=True,
                )

                session.add(user)
                await session.flush()
            else:
                await invalidate_credentials(session, user)

                user.hashed_password = hashed
                user.is_verified = True

            add_mail(
                session, email, 
                (
                    'welcome'
                    if purpose == "register"
                    else "password_changed"
                )
            )

            success = True

    if not success:
            raise HTTPException(
            status_code=400,
            detail=INVALID_CODE,
        )

async def locked_actor(
        session: AsyncSession, 
        actor: User
) -> User:
    expected_tag = credential_tag(actor)

    user = await session.scalar(
        select(User)
        .where(User.id == actor.id)
        .with_for_update()
        .execution_options(
            populate_existing=True
        )
    )

    if (
        user is None
        or not user.is_active
        or not user.is_verified
        or credential_tag(user) != expected_tag
    ):
        raise HTTPException(
            status_code=401,
            detail="AUTHENTICATION_REQUIRED",
        )

    return user

async def change_password(
    actor: User, 
    current_password: str,
    password: str, 
) -> None:
    await require_limit(
        key=f'sensitive:{actor.id}',
        limit=10,
        seconds=600
    )

    await validate_password(password)
    hashed = await hash_password(password)

    async with db_helper.session_factory.begin() as session:
        await lock_emails(session, actor.email)

        user = await locked_actor(session, actor)

        await check_current_password(
            current_password, user
        )

        await invalidate_credentials(session, user)
        user.hashed_password = hashed

        add_mail(
            session, actor.email, 'password_changed'
        )

async def request_email_change(
        actor: User,
        email: str, 
        current_password: str
) -> None:
    email = normalize(email)

    await require_limit(
        key=f'sensitive:{actor.id}',
        limit=10,
        seconds=600
    )

    if not await hit(
        key=f"mail-address:{email}",
        limit=5,
        seconds=3600,
    ):
        return 

    async with db_helper.session_factory.begin() as session:
        await lock_emails(session, actor.email, email)

        user = await locked_actor(session, actor)

        await check_current_password(
            current_password, 
            user
        )

        existing = await find_user(
            session, email, lock=False
        )

        if existing is None:
            await issue(
                session, 'email_change', email, user
            )

async def confirm_email_change(
        actor: User, 
        email: str, 
        code: str, 
        current_password: str
) -> None:
    email = normalize(email)

    await  require_limit(
        key=f"sensitive:{actor.id}",
        limit=10,
        seconds=600,
    )

    success = False

    async with db_helper.session_factory.begin() as session:
        await lock_emails(session, email, actor.email)

        user = await locked_actor(session, actor)

        await check_current_password(
            current_password, user
        )

        existing = await find_user(
            session,
            email,
            lock=False,
        )

        if existing is None and await consume(
            session, 'email_change', email, code, user
        ):
            old_email = user.email

            await invalidate_credentials(session, user)

            user.email = email
            user.is_verified = True 

            add_mail(
                session,
                old_email,
                "email_changed",
            )
            add_mail(
                session,
                email,
                "email_changed",
            )

            success = True

    if not success:
        raise HTTPException(
            status_code=400,
            detail=INVALID_CODE,
        )