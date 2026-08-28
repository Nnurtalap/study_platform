import time

import aiohttp
import logging
from core.models import User 
from core.schemas.user import UserRead, UserRegisterNotification

from aiohttp import ClientError
log = logging.getLogger(__name__)

WEBHOOK_URL =  "https://httpbin.org/post"

async def send_new_user_notification(user: User) -> None:
    wh_data = UserRegisterNotification(
        user= UserRead.model_validate(user),
        ts= int(time.time())
    ).model_dump()
    try:
        log.info('Notify user created with data: %s', wh_data)
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            async with session.post(WEBHOOK_URL, json=wh_data) as response:
                if response.status == 200:
                    data = await response.json()
                    log.info('Sent webhook, got response: %s', data)
                else:
                    error_text = await response.text()
                    log.error('Webhook failed with status %s: %s', response.status, error_text[:200])

    except ClientError as e:
        log.error('Failed to send webhook due to network/client error: %s', e)
    except Exception as e:
        log.exception('Unexpected error while sending webhook: %s', e)
