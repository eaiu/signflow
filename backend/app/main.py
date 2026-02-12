from fastapi import FastAPI
from app.core.config import get_settings
from app.db.session import init_db, engine
from app.api.v1.routes.sites import router as sites_router
from app.api.v1.routes.runs import router as runs_router
from app.api.v1.routes.logs import router as logs_router
from app.api.v1.routes.config import router as config_router
from app.api.v1.routes.cookiecloud import router as cookiecloud_router
from app.api.v1.routes.jobs import router as jobs_router
from app.services.scheduler import start_scheduler, stop_scheduler, tick_message, get_scheduler
from app.services.executor import RunExecutor
from app.services.jobs import register_site_jobs
from app.services.logs import create_log
from sqlmodel import Session

settings = get_settings()

app = FastAPI(title=settings.project_name, version="0.3.0")


@app.on_event("startup")
def on_startup():
    init_db()

    def on_tick():
        with Session(engine) as session:
            create_log(session, tick_message(), level="debug")
            register_site_jobs(get_scheduler(), session)
            executor = RunExecutor(session)
            executor.execute_next()

    start_scheduler(on_tick)


@app.on_event("shutdown")
def on_shutdown():
    stop_scheduler()


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


app.include_router(sites_router, prefix=f"{settings.api_v1_prefix}/sites", tags=["sites"])
app.include_router(runs_router, prefix=f"{settings.api_v1_prefix}/runs", tags=["runs"])
app.include_router(logs_router, prefix=f"{settings.api_v1_prefix}/logs", tags=["logs"])
app.include_router(config_router, prefix=f"{settings.api_v1_prefix}/config", tags=["config"])
app.include_router(jobs_router, prefix=f"{settings.api_v1_prefix}/jobs", tags=["jobs"])
app.include_router(cookiecloud_router, prefix=f"{settings.api_v1_prefix}/cookiecloud", tags=["cookiecloud"])
