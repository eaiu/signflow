from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.db.models import Run
from app.schemas.runs import RunCreate, RunOut, RunUpdate
from app.services.executor import QUEUED_STATUS
from app.services.config_store import serialize_config, deserialize_config

router = APIRouter()


def _run_out(run: Run) -> RunOut:
    data = run.dict()
    data["plugin_config"] = deserialize_config(run.plugin_config)
    return RunOut(**data)


@router.get("/", response_model=list[RunOut])
def list_runs(session: Session = Depends(get_session), site_id: int | None = None):
    statement = select(Run)
    if site_id is not None:
        statement = statement.where(Run.site_id == site_id)
    runs = session.exec(statement.order_by(Run.id.desc())).all()
    return [_run_out(run) for run in runs]


@router.post("/", response_model=RunOut, status_code=201)
def create_run(payload: RunCreate, session: Session = Depends(get_session)):
    data = payload.dict()
    data["plugin_config"] = serialize_config(data.get("plugin_config"))
    run = Run(
        site_id=payload.site_id,
        status=QUEUED_STATUS,
        plugin_key=payload.plugin_key,
        plugin_config=data.get("plugin_config"),
    )
    session.add(run)
    session.commit()
    session.refresh(run)
    return _run_out(run)


@router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: int, session: Session = Depends(get_session)):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return _run_out(run)


@router.patch("/{run_id}", response_model=RunOut)
def update_run(run_id: int, payload: RunUpdate, session: Session = Depends(get_session)):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    data = payload.dict(exclude_unset=True)
    if "plugin_config" in data:
        data["plugin_config"] = serialize_config(data.get("plugin_config"))
    for key, value in data.items():
        setattr(run, key, value)
    session.add(run)
    session.commit()
    session.refresh(run)
    return _run_out(run)


@router.delete("/{run_id}", status_code=204)
def delete_run(run_id: int, session: Session = Depends(get_session)):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    session.delete(run)
    session.commit()
    return None
