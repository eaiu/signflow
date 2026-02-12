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
        try:
            trigger = CronTrigger.from_crontab(cron_expr)
        except ValueError:
            log_event(
                session,
                f"Invalid cron for site #{site.id}: '{cron_expr}'",
                level="warning",
                event="cron.invalid",
                payload={"site_id": site.id, "cron": cron_expr},
            )
            continue
        scheduler.add_job(enqueue_run, trigger, id=job_id, args=[site.id])
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


def enqueue_run(site_id: int) -> Run:
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
            f"Enqueued run #{run.id} for site {site_id}",
            level="info",
            run_id=run.id,
            event="run.enqueued",
            payload={"site_id": site_id, "run_id": run.id},
        )
        return run


def _extract_cron(notes: str) -> Optional[str]:
    for line in notes.splitlines():
        line = line.strip()
        if line.lower().startswith("cron:"):
            return line.split("cron:", 1)[1].strip()
    return None


def validate_cron_expression(expr: str) -> Optional[str]:
    if not expr:
        return "Cron expression is required"
    try:
        CronTrigger.from_crontab(expr)
    except ValueError as exc:
        return str(exc)
    return None


