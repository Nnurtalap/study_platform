from datetime import timedelta

from fastapi import HTTPException, Request
from sqlalchemy.dialects.postgresql import insert

from core.models import db_helper
from core.models.email_auth import AuthRateBucket

from .code_security import digest, utcnow

async def hit(key: str, limit: int, seconds: int) -> bool:
    now = utcnow()
    window = int(now.timestamp()) // seconds

    statement = insert(AuthRateBucket).values(
        key=digest('rate', key, seconds),
        window=window,
        count=1,
        expires_at=now + timedelta(seconds=seconds*2)
    )

    statement = statement.on_conflict_do_update(
        index_elements=[
            AuthRateBucket.key, 
            AuthRateBucket.window
        ],
        set_={
            'count': AuthRateBucket.count + 1
        }
    ).returning(AuthRateBucket.count)

    async with db_helper.session_factory.begin() as session:
        result = await session.execute(statement)
        count = result.scalar_one()

    return count <= limit

async def require_limit(
    key: str,
    limit: int,
    seconds: int,
) -> None:
    allowed = await hit(key, limit, seconds)

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="TOO_MANY_REQUESTS",
            headers={
                "Retry-After": str(seconds),
            },
        )

async def ip_limit(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"

    await require_limit(
        key=f"auth-ip:{ip}",
        limit=100,
        seconds=600,
    )

async def login_limit(request: Request) -> None:
    if request.url.path.endswith("/login"):
        form = await request.form()
        email = str(form.get("username", "")).strip().lower()

        await require_limit(
            key=f"login:{email}",
            limit=10,
            seconds=600,
        )