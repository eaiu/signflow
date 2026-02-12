"""Deprecated placeholder schema (kept for compatibility)."""
from pydantic import BaseModel
from typing import Optional


class SignInBase(BaseModel):
    note: Optional[str] = None
    device: Optional[str] = None
    location: Optional[str] = None


class SignInCreate(SignInBase):
    pass


class SignInOut(SignInBase):
    id: int
    created_at: str
