from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/history", tags=["History"])

@router.get("/", response_model=list[schemas.LoanHistoryResponse])
def get_all_history(db: Session = Depends(get_db)):
    return db.query(models.LoanRecord).order_by(models.LoanRecord.timestamp.desc()).all()