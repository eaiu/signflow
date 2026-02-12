from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.db.models import Run
from app.schemas.runs import RunCreate, RunOut, RunUpdate

router = APIRouter()


@router.get("/", response_model=list[RunOut])
def list_runs(session: Session = Depends(get_session), site_id: int | None = None):
    statement = select(Run)
    if site_id is not None:
        statement = statement.where(Run.site_id == site_id)
    return session.exec(statement.order_by(Run.id.desc())).all()


@router.post("/", response_model=RunOut, status_code=201)
def create_run(payload: RunCreate, session: Session = Depends(get_session)):
    run = Run(site_id=payload.site_id)
    session.add(run)
    session.commit()
    session.refresh(run)
    return run


@router.get("/{run_id}", response_model=RunOut)
def get_run(run_id: int, session: Session = Depends(get_session)):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.patch("/{run_id}", response_model=RunOut)
def update_run(run_id: int, payload: RunUpdate, session: Session = Depends(get_session)):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    data = payload.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(run, key, value)
    session.add(run)
    session.commit()
    session.refresh(run)
    return run


@router.delete("/{run_id}", status_code=204)
def delete_run(run_id: int, session: Session = Depends(get_session)):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    session.delete(run)
    session.commit()
    return None
