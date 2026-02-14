"""Run execution worker."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.db.models import Run, Site
from app.plugins.base import PluginContext, PluginResult
from app.plugins.loader import load_configured_plugins
from app.plugins.registry import get_registry
from app.services.hooks import log_event
from app.services.config_store import deserialize_config
from app.services.cookiecloud_sync import CookieCloudSyncService
from app.services.cookiecloud_injector import inject_cookiecloud_context


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
        log_event(self.session, f"Run #{run.id} started", run_id=run.id, event="run.started")
        if site:
            log_event(
                self.session,
                f"Target site: {site.name} ({site.url})",
                level="debug",
                run_id=run.id,
                event="run.target",
                payload={"site_id": site.id, "site_name": site.name, "site_url": site.url},
            )
            if site.cookiecloud_uuid:
                log_event(
                    self.session,
                    f"CookieCloud uuid: {site.cookiecloud_uuid}",
                    level="debug",
                    run_id=run.id,
                    event="run.cookiecloud",
                    payload={"uuid": site.cookiecloud_uuid},
                )
        try:
            result = self._execute_run(run, site)
            run.status = SUCCESS_STATUS if result.ok else FAILED_STATUS
            run.error = None if result.ok else result.message
            run.finished_at = datetime.utcnow()
            self.session.add(run)
            self.session.commit()
            self.session.refresh(run)
            log_event(self.session, f"Run #{run.id} finished", run_id=run.id, event="run.finished")
        except Exception as exc:
            run.status = FAILED_STATUS
            run.error = str(exc)
            run.finished_at = datetime.utcnow()
            self.session.add(run)
            self.session.commit()
            self.session.refresh(run)
            log_event(
                self.session,
                f"Run #{run.id} failed: {exc}",
                level="error",
                run_id=run.id,
                event="run.failed",
                payload={"error": str(exc)},
            )
        return run

    def _execute_run(self, run: Run, site: Optional[Site]) -> PluginResult:
        if not site:
            return PluginResult.failure("Site not found")
        registry = get_registry()
        if not registry.list():
            load_configured_plugins()
        plugin_key = run.plugin_key or site.plugin_key
        plugin_config_raw = run.plugin_config or site.plugin_config
        plugin = registry.get(plugin_key)
        if not plugin:
            log_event(
                self.session,
                f"No plugin configured for site {site.id}.",
                level="warning",
                run_id=run.id,
                event="plugin.missing",
                payload={"site_id": site.id},
            )
            return PluginResult.failure("No plugin configured")
        context = PluginContext(
            run_id=run.id,
            site_id=site.id,
            site_name=site.name,
            site_url=site.url,
            cookie_domain=site.cookie_domain,
            cookiecloud_uuid=site.cookiecloud_uuid,
            plugin_config=deserialize_config(plugin_config_raw),
            started_at=run.started_at or datetime.utcnow(),
            notes=site.notes,
        )

        # CookieCloud: sync before each run when uuid configured; inject selected domain cookies into context.
        if site.cookiecloud_uuid:
            try:
                sync_service = CookieCloudSyncService()
                sync_result = sync_service.sync(site.cookiecloud_uuid)
                log_event(
                    self.session,
                    f"CookieCloud checked for {site.cookiecloud_uuid} (updated={sync_result.get('cache_updated')})",
                    level="debug",
                    run_id=run.id,
                    event="cookiecloud.synced",
                    payload={
                        "uuid": site.cookiecloud_uuid,
                        "cache_updated": bool(sync_result.get("cache_updated")),
                    },
                )
            except Exception as exc:
                log_event(
                    self.session,
                    f"CookieCloud sync failed: {exc}",
                    level="warning",
                    run_id=run.id,
                    event="cookiecloud.sync_failed",
                    payload={"uuid": site.cookiecloud_uuid, "error": str(exc)},
                )

            # Inject cookies from local cache (if cookie_domain present)
            inject_cookiecloud_context(
                context,
                uuid=site.cookiecloud_uuid,
                cookie_domain=site.cookie_domain,
            )
        log_event(
            self.session,
            f"Plugin {plugin.key} started",
            level="info",
            run_id=run.id,
            event="plugin.started",
            payload={"plugin_key": plugin.key},
        )
        before_result = plugin.before_run(context)
        if before_result:
            log_event(
                self.session,
                f"Plugin before_run: {before_result.message}",
                level="debug",
                run_id=run.id,
                event="plugin.before",
                payload={"plugin_key": plugin.key, "ok": before_result.ok},
            )
            if not before_result.ok:
                return before_result
        result = plugin.run(context)
        log_event(
            self.session,
            f"Plugin run: {result.message}",
            level="info" if result.ok else "error",
            run_id=run.id,
            event="plugin.run",
            payload={"plugin_key": plugin.key, "ok": result.ok},
        )
        after_result = plugin.after_run(context, result)
        if after_result:
            log_event(
                self.session,
                f"Plugin after_run: {after_result.message}",
                level="debug",
                run_id=run.id,
                event="plugin.after",
                payload={"plugin_key": plugin.key, "ok": after_result.ok},
            )
            return after_result
        return result
