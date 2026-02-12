from fastapi import APIRouter, HTTPException
from app.schemas.signin import SignInCreate, SignInOut

router = APIRouter()

# NOTE: This is a minimal skeleton. Persistence is not wired yet.
_FAKE_DB = []

@router.post("", response_model=SignInOut, status_code=201)
def create_signin(payload: SignInCreate):
    item = {
        "id": len(_FAKE_DB) + 1,
        "created_at": "2026-02-12T20:06:00+08:00",
        "note": payload.note,
        "device": payload.device,
        "location": payload.location,
    }
    _FAKE_DB.append(item)
    return item

@router.get("", response_model=list[SignInOut])
def list_signins(limit: int = 50, offset: int = 0):
    return _FAKE_DB[offset : offset + limit]

@router.get("/{signin_id}", response_model=SignInOut)
def get_signin(signin_id: int):
    for item in _FAKE_DB:
        if item["id"] == signin_id:
            return item
    raise HTTPException(status_code=404, detail="Not found")

@router.delete("/{signin_id}", status_code=204)
def delete_signin(signin_id: int):
    global _FAKE_DB
    _FAKE_DB = [item for item in _FAKE_DB if item["id"] != signin_id]
    return None
