from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.db.session import get_session, engine
from app.db.models import LogEntry
from app.schemas.logs import LogCreate, LogOut
from app.services.config_store import serialize_config
import asyncio
import json

router = APIRouter()


def _log_out(entry: LogEntry) -> dict:
    data = {
        "id": entry.id,
        "run_id": entry.run_id,
        "level": entry.level,
        "message": entry.message,
        "payload": None,
        "created_at": entry.created_at,
    }
    if entry.payload:
        try:
            data["payload"] = json.loads(entry.payload)
        except json.JSONDecodeError:
            data["payload"] = None
    return data


@router.get("/", response_model=list[LogOut])
def list_logs(session: Session = Depends(get_session), run_id: int | None = None, limit: int = 200):
    statement = select(LogEntry)
    if run_id is not None:
        statement = statement.where(LogEntry.run_id == run_id)
    statement = statement.order_by(LogEntry.id.desc()).limit(limit)
    return list(reversed([LogOut(**_log_out(entry)) for entry in session.exec(statement).all()]))


@router.post("/", response_model=LogOut, status_code=201)
def create_log(payload: LogCreate, session: Session = Depends(get_session)):
    data = payload.dict()
    if data.get("payload") is not None:
        data["payload"] = serialize_config(data.get("payload"))
    log_entry = LogEntry(**data)
    session.add(log_entry)
    session.commit()
    session.refresh(log_entry)
    return LogOut(**_log_out(log_entry))


@router.get("/{log_id}", response_model=LogOut)
def get_log(log_id: int, session: Session = Depends(get_session)):
    log_entry = session.get(LogEntry, log_id)
    if not log_entry:
        raise HTTPException(status_code=404, detail="Log not found")
    return LogOut(**_log_out(log_entry))


@router.delete("/{log_id}", status_code=204)
def delete_log(log_id: int, session: Session = Depends(get_session)):
    log_entry = session.get(LogEntry, log_id)
    if not log_entry:
        raise HTTPException(status_code=404, detail="Log not found")
    session.delete(log_entry)
    session.commit()
    return None


@router.get("/stream")
async def stream_logs(run_id: int | None = None, since_id: int | None = None, poll_interval: float = 1.5):
    async def event_generator():
        last_id = since_id or 0
        while True:
            await asyncio.sleep(poll_interval)
            with Session(engine) as session:
                statement = select(LogEntry).where(LogEntry.id > last_id)
                if run_id is not None:
                    statement = statement.where(LogEntry.run_id == run_id)
                statement = statement.order_by(LogEntry.id)
                entries = session.exec(statement).all()
            if entries:
                for entry in entries:
                    last_id = entry.id
                    payload = _log_out(entry)
                    yield f"data: {json.dumps(payload, default=str)}\n\n"
            else:
                payload = {"type": "heartbeat", "last_id": last_id, "run_id": run_id}
                yield f"data: {json.dumps(payload)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
