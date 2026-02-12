from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.db.models import Site
from app.schemas.sites import SiteCreate, SiteOut, SiteUpdate
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=list[SiteOut])
def list_sites(session: Session = Depends(get_session)):
    return session.exec(select(Site).order_by(Site.id)).all()


@router.post("/", response_model=SiteOut, status_code=201)
def create_site(payload: SiteCreate, session: Session = Depends(get_session)):
    site = Site(**payload.dict())
    session.add(site)
    session.commit()
    session.refresh(site)
    return site


@router.get("/{site_id}", response_model=SiteOut)
def get_site(site_id: int, session: Session = Depends(get_session)):
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


@router.patch("/{site_id}", response_model=SiteOut)
def update_site(site_id: int, payload: SiteUpdate, session: Session = Depends(get_session)):
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    data = payload.dict(exclude_unset=True)
    for key, value in data.items():
        setattr(site, key, value)
    site.updated_at = datetime.utcnow()
    session.add(site)
    session.commit()
    session.refresh(site)
    return site


@router.delete("/{site_id}", status_code=204)
def delete_site(site_id: int, session: Session = Depends(get_session)):
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    session.delete(site)
    session.commit()
    return None
