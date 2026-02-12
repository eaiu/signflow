"""Scheduler helpers."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.job import Job

_scheduler: Optional[BackgroundScheduler] = None



def get_scheduler() -> Optional[BackgroundScheduler]:
    return _scheduler



def start_scheduler(on_tick) -> Optional[BackgroundScheduler]:
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(on_tick, "interval", seconds=10, id="tick")
    scheduler.start()
    _scheduler = scheduler
    return scheduler



def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        _scheduler = None



def tick_message() -> str:
    return f"Scheduler tick @ {datetime.utcnow().isoformat()}"
