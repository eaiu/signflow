"""Scheduler service."""
from datetime import datetime
from typing import Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.core.config import get_settings

settings = get_settings()
_scheduler: Optional[BackgroundScheduler] = None


def get_scheduler() -> Optional[BackgroundScheduler]:
    return _scheduler


def start_scheduler(on_tick):
    global _scheduler
    if not settings.scheduler_enabled:
        return None
    if _scheduler:
        return _scheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(on_tick, IntervalTrigger(seconds=60), id="tick", replace_existing=True)
    scheduler.start()
    _scheduler = scheduler
    return scheduler


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None


def tick_message() -> str:
    return f"scheduler tick {datetime.utcnow().isoformat()}"
