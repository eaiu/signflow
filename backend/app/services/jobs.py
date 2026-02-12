"""Cron-based job mapping to sites."""
from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session, select

from app.db.models import Site, Run
from app.services.hooks import log_event


def register_site_jobs(scheduler, session: Session) -> List[str]:
    if scheduler is None:
        return []

    existing = {job.id for job in scheduler.get_jobs()}
    valid_job_ids = set()

    for site in session.exec(select(Site).where(Site.enabled == True)):  # noqa: E712
        if not site.notes:
            continue
        cron_expr = _extract_cron(site.notes)
        if not cron_expr:
            continue
        job_id = f"site:{site.id}"
        valid_job_ids.add(job_id)
        if job_id in existing:
            continue
        trigger = CronTrigger.from_crontab(cron_expr)
        scheduler.add_job(_enqueue_run, trigger, id=job_id, args=[site.id])
        log_event(
            session,
            f"Scheduled site #{site.id} ({site.name}) with cron '{cron_expr}'",
            level="info",
            event="cron.scheduled",
            payload={"site_id": site.id, "cron": cron_expr},
        )

    for job_id in list(existing):
        if job_id.startswith("site:") and job_id not in valid_job_ids:
            scheduler.remove_job(job_id)
    return list(existing)


def _enqueue_run(site_id: int):
    from app.db.session import engine
    with Session(engine) as session:
        run = Run(site_id=site_id, status="queued", created_at=datetime.utcnow())
        if site := session.get(Site, site_id):
            run.plugin_key = site.plugin_key
            run.plugin_config = site.plugin_config
        session.add(run)
        session.commit()
        session.refresh(run)
        log_event(
            session,
            f"Cron enqueued run #{run.id} for site {site_id}",
            level="info",
            run_id=run.id,
            event="cron.enqueued",
            payload={"site_id": site_id, "run_id": run.id},
        )


def _extract_cron(notes: str) -> Optional[str]:
    for line in notes.splitlines():
        line = line.strip()
        if line.lower().startswith("cron:"):
            return line.split("cron:", 1)[1].strip()
    return None
