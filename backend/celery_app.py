from celery import Celery
import os
from dotenv import load_dotenv
from celery.schedules import crontab
load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "digital_banking",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)


celery_app.conf.beat_schedule = {
    "scan-bills-every-minute": {
        "task": "backend.tasks.bill_reminders.scan_bills_due",
        "schedule": crontab(minute="*/1"),
    }
}

celery_app.conf.update(
    include=["backend.tasks.bill_reminders"]
)

celery_app.autodiscover_tasks(["backend.tasks"])
