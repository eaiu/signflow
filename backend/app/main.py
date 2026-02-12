from fastapi import Depends, FastAPI
from app.core.config import get_settings
from app.core.security import require_api_token
from app.db.session import init_db, engine
from app.api.v1.routes.sites import router as sites_router
from app.api.v1.routes.runs import router as runs_router
from app.api.v1.routes.logs import router as logs_router
from app.api.v1.routes.config import router as config_router
from app.api.v1.routes.cookiecloud import router as cookiecloud_router
from app.api.v1.routes.jobs import router as jobs_router
from app.api.v1.routes.plugins import router as plugins_router
from app.services.scheduler import start_scheduler, stop_scheduler, tick_message, get_scheduler
from app.services.executor import RunExecutor
from app.services.jobs import register_site_jobs
from app.services.hooks import log_event
from app.plugins.loader import load_configured_plugins
from sqlmodel import Session

settings = get_settings()

app = FastAPI(title=settings.project_name, version="0.4.0")


@app.on_event("startup")
def on_startup():
    init_db()
    load_configured_plugins()

    def on_tick():
        with Session(engine) as session:
            log_event(session, tick_message(), level="debug", event="scheduler.tick")
            register_site_jobs(get_scheduler(), session)
            executor = RunExecutor(session)
            executor.execute_next()

    start_scheduler(on_tick)


@app.on_event("shutdown")
def on_shutdown():
    stop_scheduler()


protected_dependencies = [Depends(require_api_token)]


@app.get("/api/v1/health", dependencies=protected_dependencies)
def health():
    return {"status": "ok"}

app.include_router(
    sites_router,
    prefix=f"{settings.api_v1_prefix}/sites",
    tags=["sites"],
    dependencies=protected_dependencies,
)
app.include_router(
    runs_router,
    prefix=f"{settings.api_v1_prefix}/runs",
    tags=["runs"],
    dependencies=protected_dependencies,
)
app.include_router(
    logs_router,
    prefix=f"{settings.api_v1_prefix}/logs",
    tags=["logs"],
    dependencies=protected_dependencies,
)
app.include_router(
    jobs_router,
    prefix=f"{settings.api_v1_prefix}/jobs",
    tags=["jobs"],
    dependencies=protected_dependencies,
)
app.include_router(
    cookiecloud_router,
    prefix=f"{settings.api_v1_prefix}/cookiecloud",
    tags=["cookiecloud"],
    dependencies=protected_dependencies,
)
app.include_router(
    config_router,
    prefix=f"{settings.api_v1_prefix}/config",
    tags=["config"],
    dependencies=protected_dependencies,
)
app.include_router(
    plugins_router,
    prefix=f"{settings.api_v1_prefix}/plugins",
    tags=["plugins"],
    dependencies=protected_dependencies,
)
