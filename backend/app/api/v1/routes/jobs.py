from fastapi import APIRouter
from app.services.scheduler import get_scheduler
from app.schemas.jobs import JobOut

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
