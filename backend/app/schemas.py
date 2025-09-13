# app/schemas.py
from pydantic import BaseModel

class ItemBase(BaseModel):
    title: str
    description: str | None = None

class ItemCreate(ItemBase): pass

class ItemOut(ItemBase):
    id: int
    class Config:
        from_attributes = True   # pydantic v2
