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
class LoanHistoryResponse(BaseModel):
    id: int
    timestamp: datetime
    income: float
    status: str
    top_reason: str
    ai_voice_message: str

    class Config:
        from_attributes = True