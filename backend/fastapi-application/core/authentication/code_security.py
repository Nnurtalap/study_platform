import hashlib
import hmac
import json
import secrets
from datetime import datetime, timezone

import asyncio

import aiohttp
from fastapi import HTTPException
from fastapi_users.password import PasswordHelper

from cryptography.fernet import Fernet

from .code_settings import code_settings as cfg

password_helper = PasswordHelper()

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

def new_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"

def digest(*parts: object) -> str:
    payload = json.dumps(
        parts,
        ensure_ascii=False,
        separators=(',',':')
    )

    return hmac.new(
        cfg.hmac_key.get_secret_value().encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def encrypt(payload: dict) -> str:
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    key = cfg.encryption_key.get_secret_value().encode('ascii')

    return Fernet(key).encrypt(data).decode('ascii')

def decrypt(payload: str) -> dict:
    key = cfg.encryption_key.get_secret_value().encode('ascii')
    data = Fernet(key).decrypt(payload.encode('utf-8'))

    return json.loads(data.decode('utf-8'))

async def validate_password(password: str) -> None:
    if not 15 <= len(password) <= 128:
        raise HTTPException(400, "PASSWORD_LENGTH_15_128")

    if not cfg.check_breached_passwords:
        return 

    hashed = hashlib.sha1(
        password.encode('utf-8')
    ).hexdigest().upper()

    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=5)
        ) as client:
            async with client.get(
                f"https://api.pwnedpasswords.com/range/{hashed[:5]}",
                headers={
                    "Add-Padding": "true",
                    "User-Agent": "EmailCodeAuth/1.0",
                },
            ) as response:
                response.raise_for_status()
                ranges = await response.text()

            for line in ranges.splitlines():
                suffix, count = line.split(':', 5)

                if (
                    hmac.compare_digest(
                        suffix, hashed[5:]
                    ) 
                    and int(count) > 0
                ): 
                    raise HTTPException(400, "PASSWORD_COMPROMISED")

    except (aiohttp.ClientError, asyncio.TimeoutError, ValueError):
        raise HTTPException(
            503,
            "PASSWORD_CHECK_UNAVAILABLE",
        ) from None

async def hash_password(password: str) -> str:
        return await asyncio.to_thread(
            password_helper.hash,
            password
        )

async def check_current_password(password: str, user) -> None:
    valid, _ = await asyncio.to_thread(
        password_helper.verify_and_update, 
        password, 
        user.hashed_password
    )
    if not valid:
        raise HTTPException(400, "CURRENT_PASSWORD_INVALID")

def credential_tag(user) -> str:
    return digest(
        "credentials",
        user.id,
        user.email.lower(),
        user.hashed_password,
    )