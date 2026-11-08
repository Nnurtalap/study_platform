from celery import Celery
from kombu import Queue

from core.authentication.code_settings import code_settings


celery_app = Celery(
    "email_auth",
    broker=code_settings.broker_url.get_secret_value(),
    include=["core.tasks.email"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    task_ignore_result=True,

    enable_utc=True,
    timezone="UTC",

    broker_connection_retry_on_startup=True,
    broker_connection_timeout=5,
    broker_transport_options={
        "confirm_publish": True,
    },
    task_publish_retry=False,

    task_default_delivery_mode="persistent",

    task_queues=(
        Queue("email", durable=True),
        Queue("email_dispatch", durable=True),
    ),
    task_default_queue="email",

    task_routes={
        "email.send": {"queue": "email"},
        "email.dispatch": {"queue": "email_dispatch"},
        "email.cleanup": {"queue": "email_dispatch"},
    },

    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    task_soft_time_limit=50,
    task_time_limit=60,

    beat_schedule={
        "dispatch-outbox": {
            "task": "email.dispatch",
            "schedule": 5.0,
            "options": {
                "queue": "email_dispatch",
                "expires": 20,
            },
        },
        "cleanup-auth": {
            "task": "email.cleanup",
            "schedule": 3600.0,
            "options": {
                "queue": "email_dispatch",
                "expires": 1800,
            },
        },
    },
)