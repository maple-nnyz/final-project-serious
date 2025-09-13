from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from app.database import get_db

router = APIRouter()

@router.get("/api/items")
def list_items(db: Session = Depends(get_db)):
    return db.query(models.Item).all()

@router.post("/api/items")
def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    obj = models.Item(**item.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj
