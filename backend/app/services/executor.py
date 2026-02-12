"""Run execution worker."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.db.models import Run, Site
from app.services.logs import create_log


QUEUED_STATUS = "queued"
RUNNING_STATUS = "running"
SUCCESS_STATUS = "success"
FAILED_STATUS = "failed"


class RunExecutor:
    def __init__(self, session: Session):
        self.session = session

    def claim_next_run(self) -> Optional[Run]:
        statement = select(Run).where(Run.status == QUEUED_STATUS).order_by(Run.id)
        run = self.session.exec(statement).first()
        if not run:
            return None
        run.status = RUNNING_STATUS
        run.started_at = datetime.utcnow()
        self.session.add(run)
        self.session.commit()
        self.session.refresh(run)
        return run

    def execute_next(self) -> Optional[Run]:
        run = self.claim_next_run()
        if not run:
            return None

        site = self.session.get(Site, run.site_id)
        create_log(self.session, f"Run #{run.id} started", run_id=run.id)
        if site:
            create_log(
                self.session,
                f"Target site: {site.name} ({site.url})",
                level="debug",
                run_id=run.id,
            )
            if site.cookiecloud_profile:
                create_log(
                    self.session,
                    f"CookieCloud profile: {site.cookiecloud_profile}",
                    level="debug",
                    run_id=run.id,
                )
        try:
            create_log(self.session, "Execution stub: no site automation wired yet.", level="warning", run_id=run.id)
            run.status = SUCCESS_STATUS
            run.finished_at = datetime.utcnow()
            self.session.add(run)
            self.session.commit()
            self.session.refresh(run)
            create_log(self.session, f"Run #{run.id} finished", run_id=run.id)
        except Exception as exc:
            run.status = FAILED_STATUS
            run.error = str(exc)
            run.finished_at = datetime.utcnow()
            self.session.add(run)
            self.session.commit()
            self.session.refresh(run)
            create_log(self.session, f"Run #{run.id} failed: {exc}", level="error", run_id=run.id)
        return run
