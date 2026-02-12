"""Run execution worker."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.core.config import get_settings
from app.db.models import Run, Site
from app.plugins.base import PluginContext, PluginResult
from app.plugins.loader import load_configured_plugins
from app.plugins.registry import get_registry
from app.services.logs import create_log


QUEUED_STATUS = "queued"
RUNNING_STATUS = "running"
SUCCESS_STATUS = "success"
FAILED_STATUS = "failed"


class RunExecutor:
    def __init__(self, session: Session):
        self.session = session
        self.settings = get_settings()

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
            result = self._execute_run(run, site)
            run.status = SUCCESS_STATUS if result.ok else FAILED_STATUS
            run.error = None if result.ok else result.message
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

    def _execute_run(self, run: Run, site: Optional[Site]) -> PluginResult:
        if not site:
            return PluginResult.failure("Site not found")
        registry = get_registry()
        if not registry.list():
            load_configured_plugins()
        plugin_key = run.plugin_key or site.plugin_key
        plugin = registry.get(plugin_key)
        if not plugin:
            create_log(
                self.session,
                f"No plugin configured for site {site.id}.",
                level="warning",
                run_id=run.id,
            )
            return PluginResult.failure("No plugin configured")
        context = PluginContext(
            run_id=run.id,
            site_id=site.id,
            site_name=site.name,
            site_url=site.url,
            cookie_domain=site.cookie_domain,
            cookiecloud_profile=site.cookiecloud_profile,
            started_at=run.started_at or datetime.utcnow(),
            notes=site.notes,
        )
        create_log(self.session, f"Plugin {plugin.key} started", level="info", run_id=run.id)
        before_result = plugin.before_run(context)
        if before_result:
            create_log(self.session, f"Plugin before_run: {before_result.message}", level="debug", run_id=run.id)
            if not before_result.ok:
                return before_result
        result = plugin.run(context)
        create_log(self.session, f"Plugin run: {result.message}", level="info" if result.ok else "error", run_id=run.id)
        after_result = plugin.after_run(context, result)
        if after_result:
            create_log(self.session, f"Plugin after_run: {after_result.message}", level="debug", run_id=run.id)
            return after_result
        return result
