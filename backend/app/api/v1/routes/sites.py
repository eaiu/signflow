from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.db.models import Site
from app.schemas.sites import SiteCreate, SiteOut, SiteUpdate
from app.services.config_store import serialize_config, deserialize_config
from app.core.security import require_admin_token
from datetime import datetime

router = APIRouter()


def _site_out(site: Site) -> SiteOut:
    data = site.dict()
    data["plugin_config"] = deserialize_config(site.plugin_config)
    return SiteOut(**data)


@router.get("/", response_model=list[SiteOut])
def list_sites(session: Session = Depends(get_session)):
    sites = session.exec(select(Site).order_by(Site.id)).all()
    return [_site_out(site) for site in sites]


@router.post("/", response_model=SiteOut, status_code=201)
def create_site(payload: SiteCreate, session: Session = Depends(get_session)):
    data = payload.dict()
    if data.get("url") is not None:
        data["url"] = str(data["url"])
    data["plugin_config"] = serialize_config(data.get("plugin_config"))
    site = Site(**data)
    session.add(site)
    session.commit()
    session.refresh(site)
    return _site_out(site)


@router.get("/{site_id}", response_model=SiteOut)
def get_site(site_id: int, session: Session = Depends(get_session)):
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return _site_out(site)


@router.patch("/{site_id}", response_model=SiteOut)
def update_site(site_id: int, payload: SiteUpdate, session: Session = Depends(get_session)):
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    data = payload.dict(exclude_unset=True)
    if "plugin_config" in data:
        data["plugin_config"] = serialize_config(data.get("plugin_config"))
    for key, value in data.items():
        setattr(site, key, value)
    site.updated_at = datetime.utcnow()
    session.add(site)
    session.commit()
    session.refresh(site)
    return _site_out(site)


@router.delete("/{site_id}", status_code=204, dependencies=[Depends(require_admin_token)])
def delete_site(site_id: int, session: Session = Depends(get_session)):
    site = session.get(Site, site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    session.delete(site)
    session.commit()
    return None
