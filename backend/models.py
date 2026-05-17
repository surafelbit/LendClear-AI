from sqlalchemy import Column, Integer, Float, String, DateTime, JSON
from datetime import datetime
from database import Base

class LoanRecord(Base):
    __tablename__ = "loan_records"

    id = Column(Integer, primary_key=True, index=True)
    applicant_name = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    city = Column(String)
    income = Column(Float)
    credit_score = Column(Integer)
    loan_amount = Column(Float)
    years_employed = Column(Integer)
    points = Column(Float)
    status = Column(String)  # "Accepted" or "Rejected"
    top_reason = Column(String)
    ai_voice_message = Column(String)
    confidence = Column(Float)
    raw_shap_data = Column(JSON) # Stores all factor impacts
