from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Optional

# What the user sends for a prediction
class LoanApplication(BaseModel):
    city: str
    income: float
    credit_score: float
    loan_amount: float
    years_employed: float
    points: float

# What the history list looks like
class LoanHistory(BaseModel):
    id: int
    city: str
    income: float
    credit_score: float
    loan_amount: float
    years_employed: float
    status: str
    top_reason: str
    ai_voice_message: Optional[str]
    timestamp: datetime
    raw_shap_data: Optional[Dict] = None # For the SHAP charts in the history view

    class Config:
        # This allows Pydantic to read data from SQLAlchemy models
        from_attributes = True