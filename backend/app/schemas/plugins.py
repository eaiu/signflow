from typing import Dict, List, Optional
from pydantic import BaseModel


class PluginConfigField(BaseModel):
    key: str
    label: str
    field_type: str = "text"
    required: bool = False
    placeholder: Optional[str] = None
    description: Optional[str] = None
    options: List[Dict[str, str]] = []

    class Config:
        orm_mode = True


class PluginMeta(BaseModel):
    key: str
    name: str
    description: str = ""
    version: str = "1.0"
    category: str = "general"
    config_schema: List[PluginConfigField] = []

    class Config:
        orm_mode = True


class PluginList(BaseModel):
    __root__: List[PluginMeta]

    class Config:
        orm_mode = True


class PluginReloadResult(BaseModel):
    count: int
    plugins: List[PluginMeta]

    class Config:
        orm_mode = True


class PluginSaveRequest(BaseModel):
    key: str
    name: str
    description: Optional[str] = ""
    version: Optional[str] = "1.0"
    category: Optional[str] = "custom"
    config_schema: List[PluginConfigField] = []
    run_code: str


class PluginSaveResult(BaseModel):
    ok: bool
    plugin: PluginMeta
