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
@router.get("/summary/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Calculates summary metrics on the fly for the dashboard cards.
    This is isolated so it won't break your existing history table.
    """
    try:
        from sqlalchemy import func
        
        # 1. Total Applications
        total_count = db.query(models.LoanRecord).count()
        
        # 2. Approval Rate
        accepted_count = db.query(models.LoanRecord).filter(models.LoanRecord.status == "Accepted").count()
        approval_rate = round((accepted_count / total_count * 100), 1) if total_count > 0 else 0.0
        
        # 3. Average Credit Score
        # (Using conditional handling depending on whether your model uses 'credit_score' or 'points')
        avg_credit = db.query(func.avg(models.LoanRecord.credit_score)).scalar() or 0.0
        avg_credit = round(float(avg_credit), 0)

        return {
            "total_applications": total_count,
            "approval_rate_percentage": approval_rate,
            "average_credit_score": avg_credit
        }
    except Exception as e:
        logger.error(f"Failed to calculate stats: {e}")
        raise HTTPException(status_code=500, detail="Could not load summary metrics")