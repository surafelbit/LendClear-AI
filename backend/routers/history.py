from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/history", tags=["History"])

@router.get("/")
def get_all_history(db: Session = Depends(get_db)):
    # Returns the most recent 50 loan applications
    return db.query(models.LoanHistory).order_by(models.LoanHistory.timestamp.desc()).limit(50).all()