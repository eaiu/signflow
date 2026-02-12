from fastapi import FastAPI
from app.core.config import get_settings
from app.db.session import init_db, engine
from app.api.v1.routes.sites import router as sites_router
from app.api.v1.routes.runs import router as runs_router
from app.api.v1.routes.logs import router as logs_router
from app.api.v1.routes.config import router as config_router
from app.api.v1.routes.cookiecloud import router as cookiecloud_router
from app.services.scheduler import start_scheduler, stop_scheduler, tick_message
from app.db.models import LogEntry
from sqlmodel import Session

settings = get_settings()

app = FastAPI(title=settings.project_name, version="0.2.0")


@app.on_event("startup")
def on_startup():
    init_db()

    def on_tick():
        # add a heartbeat log entry so SSE isn't empty
        with Session(engine) as session:
            session.add(LogEntry(run_id=None, level="debug", message=tick_message()))
            session.commit()

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
app.include_router(cookiecloud_router, prefix=f"{settings.api_v1_prefix}/cookiecloud", tags=["cookiecloud"])
