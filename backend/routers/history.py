import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

logger = logging.getLogger("lendclear.history")
router = APIRouter(prefix="/history", tags=["History"])


@router.get("/", response_model=list[schemas.LoanHistory])
def get_all_history(db: Session = Depends(get_db)):
    """
    Fetches all past loan applications, newest first.
    """
    try:
        logger.info("Fetching loan application history...")
        
        # Query the database, ordered by latest timestamp
        records = db.query(models.LoanRecord).order_by(models.LoanRecord.timestamp.desc()).all()
        
        return records
        
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
@router.get("/{record_id}", response_model=schemas.LoanHistory)
def get_single_record(record_id: int, db: Session = Depends(get_db)):
    """
    Fetches a specific record by its ID (useful for a 'Details' view).
    """
    record = db.query(models.LoanRecord).filter(models.LoanRecord.id == record_id).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    return record