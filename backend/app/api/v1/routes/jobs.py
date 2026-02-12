from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.db.session import get_session
from app.db.models import Site
from app.schemas.jobs import JobOut, JobRunRequest, JobRunResponse
from app.services.scheduler import get_scheduler
from app.services.jobs import validate_cron_expression, enqueue_run
from app.core.security import require_admin_token

router = APIRouter()


@router.get("/", response_model=list[JobOut])
def list_jobs():
    scheduler = get_scheduler()
    if not scheduler:
        return []
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append(
            JobOut(
                id=job.id,
                name=str(job.name or job.id),
                next_run_time=job.next_run_time,
            )
        )
    return jobs


@router.post("/validate")
def validate_job(payload: JobRunRequest, session: Session = Depends(get_session)):
    site = session.get(Site, payload.site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    error = validate_cron_expression(payload.cron or "")
    if error:
        raise HTTPException(status_code=422, detail=error)
    return {"ok": True}


@router.post("/run", response_model=JobRunResponse, dependencies=[Depends(require_admin_token)])
def run_job(payload: JobRunRequest, session: Session = Depends(get_session)):
    site = session.get(Site, payload.site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    if payload.cron:
        error = validate_cron_expression(payload.cron)
        if error:
            raise HTTPException(status_code=422, detail=error)
    run = enqueue_run(payload.site_id)
    return JobRunResponse(ok=True, run_id=run.id, status=run.status)
