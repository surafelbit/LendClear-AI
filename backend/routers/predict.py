import logging
import joblib
import os
import pandas as pd
import shap
import xgboost as xgb
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from google import genai
from database import get_db
import models, schemas

logger = logging.getLogger("lendclear.predict")
router = APIRouter(prefix="/predict", tags=["Prediction"])

# ── 1. ML Engine Load ──────────────────────────────────────────────────
model = xgb.XGBClassifier()
encoders = {}
explainer = None

try:
    # Adjust paths if your script is running from the 'backend' folder
    model.load_model("../ml_research/loan_model_xgb.json")
    explainer = shap.TreeExplainer(model)
    encoders = joblib.load("../ml_research/encoders.pkl")
    logger.info("✅ ML Engine Online")
except Exception as e:
    logger.error(f"❌ ML Load Error: {e}")

# ── 2. Gemini Client ──────────────────────────────────────────────────
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "your_key_here")
gemini_client = genai.Client(api_key=GEMINI_KEY)

# ── 3. The Controller ─────────────────────────────────────────────────
@router.post("/")
def predict_loan(application: schemas.LoanApplication, db: Session = Depends(get_db)):
    try:
        feature_names = ["city", "income", "credit_score", "loan_amount", "years_employed"]

        # A. Encoding
        city_int = 0
        if "city" in encoders:
            try:
                city_int = int(encoders["city"].transform([application.city])[0])
            except:
                city_int = 0

        # B. Data Prep
        raw = {
            "city": city_int,
            "income": int(application.income),
            "credit_score": int(application.credit_score),
            "loan_amount": int(application.loan_amount),
            "years_employed": int(application.years_employed),
        }
        df = pd.DataFrame([raw])[feature_names]

        # C. Prediction
        prediction = int(model.predict(df)[0])
        probability = float(model.predict_proba(df)[0][1])
        status = "Accepted" if prediction == 1 else "Rejected"

        # D. SHAP logic
        shap_values = explainer.shap_values(df)
        impacts = dict(zip(feature_names, shap_values[0].tolist()))
        sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reason_raw = sorted_impacts[0][0]
        top_reason_display = top_reason_raw.replace("_", " ").title()

        # E. Gemini AI Voice
        ai_message = f"Decision based on {top_reason_display}."
        if gemini_client:
            try:
                prompt = (
                    f"A loan application for someone with an income of {application.income} "
                    f"and a credit score of {application.credit_score} was {status}. "
                    f"The main deciding factor was {top_reason_display}. "
                    f"Write a single professional sentence explaining this decision."
                )
                response = gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                )
                ai_message = response.text.strip()
            except Exception as ai_err:
                logger.error(f"❌ Gemini error: {ai_err}")
                ai_message = f"Decision based on {top_reason_display}."
        # if gemini_client:
        #     prompt = (
        #         f"A loan for {application.income} was {status}. "
        #         f"Main factor: {top_reason_display}. "
        #         "Explain this in one short, professional sentence."
        #     )
        #     response = gemini_client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        #     ai_message = response.text.strip()

        # F. DB SAVE (Postgres)
        new_record = models.LoanRecord(
            city=application.city,
            income=application.income,
            credit_score=application.credit_score,
            loan_amount=application.loan_amount,
            years_employed=application.years_employed,
            status=status,
            top_reason=top_reason_display,
            ai_voice_message=ai_message,
            confidence=probability, # This is the 0.XX value
            raw_shap_data=impacts
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        # G. THE COMPLETE RESPONSE (Matching your exact original keys)
        return {
            "id": new_record.id, # New: useful for frontend tracking
            "approved": bool(prediction),
            "status": status,
            "confidence": round(probability, 2),
            "top_reason": top_reason_display,
            "ai_voice_message": ai_message,
            "raw_data": impacts, # This is the 'raw_data' your frontend uses for charts
        }

    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))