
import logging
import joblib
import os
import pandas as pd
import shap
import xgboost as xgb
import csv
import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from google import genai
from database import get_db
import models, schemas
reg_model = xgb.XGBRegressor() # NEW: The Safe Amount Calculator
logger = logging.getLogger("lendclear.predict")
router = APIRouter(prefix="/predict", tags=["Prediction"])

# ── 1. ML Engine Load ──────────────────────────────────────────────────
model = xgb.XGBClassifier()
encoders = {}
explainer = None

try:
    # Keep your existing paths
    model.load_model("../ml_research/loan_model_xgb.json")
    reg_model.load_model("../ml_research/loan_amount_regressor_xgb.json") # LOAD IT    
    explainer = shap.TreeExplainer(model)
    encoders = joblib.load("../ml_research/encoders.pkl")
    logger.info("✅ ML Engine Online")
except Exception as e:
    logger.error(f"❌ ML Load Error: {e}")

# ── 2. Gemini Client ──────────────────────────────────────────────────
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "your_key_here")
gemini_client = genai.Client(api_key=GEMINI_KEY)

# ── 3. Internal Helper (The "Brain") ──────────────────────────────────
# This function handles the logic for BOTH single and bulk predictions.
def run_internal_prediction(city: str, income: float, credit_score: float, loan_amount: float, years_employed: float):
    # feature_names = ["city", "income", "credit_score", "loan_amount", "years_employed"]

    # # A. Encoding
    # city_int = 0
    # if "city" in encoders:
    #     try:
    #         city_int = int(encoders["city"].transform([city])[0])
    #     except:
    #         city_int = 0

    # # B. Data Prep
    # raw = {
    #     "city": city_int,
    #     "income": int(income),
    #     "credit_score": int(credit_score),
    #     "loan_amount": int(loan_amount),
    #     "years_employed": int(years_employed),
    # }
    # df = pd.DataFrame([raw])[feature_names]

    # # C. Prediction
    # prediction = int(model.predict(df)[0])
    # probability = float(model.predict_proba(df)[0][1])
    feature_names = ["city", "income", "credit_score", "loan_amount", "years_employed", "dti_ratio", "stability_index"]

    # (Your existing LabelEncoder code for city goes here)
    city_int = 0
    if "city" in encoders:
        try:
            city_int = int(encoders["city"].transform([city])[0])
        except:
            city_int = 0

    # ── 2. CALCULATE THE NEW ENGINEERED FEATURES ON THE FLY ──
    calculated_dti = loan_amount / (income + 1)
    calculated_stability = years_employed * credit_score

    # ── 3. ADD THEM TO YOUR RAW DICTIONARY ──
    raw = {
        "city": city_int,
        "income": int(income),
        "credit_score": int(credit_score),
        "loan_amount": int(loan_amount),
        "years_employed": int(years_employed),
        "dti_ratio": float(calculated_dti),          # 💥 Added
        "stability_index": float(calculated_stability) # 💥 Added
    }
    
    # 4. Create the DataFrame and enforce the 7-column order
    df = pd.DataFrame([raw])[feature_names]

    # Now when this runs, it has all 7 features and will match perfectly!
    prediction = int(model.predict(df)[0])
    probability = float(model.predict_proba(df)[0][1])
    status = "Accepted" if prediction == 1 else "Rejected"
    if probability >= 0.85:
        risk_tier = "Tier 1: Low Risk"
    elif probability >= 0.55:
        risk_tier = "Tier 2: Medium Risk"
    else:
        risk_tier = "Tier 3: High Risk"
    try:
        reg_prediction = float(reg_model.predict(df)[0])
        # Enforce that a recommended loan amount can't drop below zero
        recommended_amount = round(max(0.0, reg_prediction), 2)
    except Exception as reg_err:
        logger.error(f"❌ Regressor Prediction Error: {reg_err}")
        recommended_amount = round(loan_amount, 2) #    

    # D. SHAP logic
    shap_values = explainer.shap_values(df)
    impacts = dict(zip(feature_names, shap_values[0].tolist()))
    sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)
    top_reason_display = sorted_impacts[0][0].replace("_", " ").title()

    # E. Gemini AI Voice
    ai_message = f"Decision based on {top_reason_display}."
    if gemini_client:
        try:
            prompt = (
                f"A loan application for someone with an income of {income} "
                f"and a credit score of {credit_score} was {status}. "
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

    return {
        "status": status,
        "prediction": prediction,
        "probability": probability,
        "impacts": impacts,
        "top_reason": top_reason_display,
        "ai_message": ai_message,
        "risk_tier": risk_tier,                 # ◄── Added to dictionary
        "recommended_amount": recommended_amount
    }

# ── 4. Single Prediction Endpoint ─────────────────────────────────────
@router.post("/")
def predict_loan(application: schemas.LoanApplication, db: Session = Depends(get_db)):
    try:
        # Use our helper
        result = run_internal_prediction(
            application.city, application.income, application.credit_score, 
            application.loan_amount, application.years_employed
        )

        new_record = models.LoanRecord(
            applicant_name=application.applicant_name,
            city=application.city,
            income=application.income,
            credit_score=application.credit_score,
            loan_amount=application.loan_amount,
            years_employed=application.years_employed,
            status=result["status"],
            top_reason=result["top_reason"],
            ai_voice_message=result["ai_message"],
            confidence=result["probability"],
            raw_shap_data=result["impacts"],
            
            risk_tier=result["risk_tier"],
            recommended_amount=result["recommended_amount"]
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return {
            "id": new_record.id,
            "applicant_name": new_record.applicant_name,
            "approved": bool(result["prediction"]),
            "status": result["status"],
            "confidence": round(result["probability"], 2),
            "top_reason": result["top_reason"],
            "ai_voice_message": result["ai_message"],
            "raw_data": result["impacts"],
            "risk_tier": result["risk_tier"],
            "recommended_amount": result["recommended_amount"]
        }
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── 5. Bulk Prediction Endpoint (FIXED) ────────────────────────────────
@router.post("/bulk")
async def predict_bulk(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    try:
        content = await file.read()
        stream = io.StringIO(content.decode('utf-8'))
        reader = csv.DictReader(stream)

        count = 0
        for row in reader:
            # 1. REMOVED applicant_name from here so the ML engine stays pure
            res = run_internal_prediction(
                city=row.get('city', 'Unknown'),
                income=float(row['income']),
                credit_score=float(row['credit_score']),
                loan_amount=float(row['loan_amount']),
                years_employed=float(row['years_employed'])
            )

            db_record = models.LoanRecord(
                applicant_name=row.get('applicant_name', 'Unknown User'), # <-- ASSIGNED HERE
                city=row.get('city', 'Unknown'),
                income=float(row['income']),
                credit_score=float(row['credit_score']),
                loan_amount=float(row['loan_amount']),
                years_employed=float(row['years_employed']),
                status=res["status"],
                top_reason=res["top_reason"],
                ai_voice_message=res["ai_message"],
                confidence=res["probability"],
                raw_shap_data=res["impacts"]
                risk_tier=res["risk_tier"],
                recommended_amount=res["recommended_amount"]
            )
            db.add(db_record)
            count += 1

        db.commit()
        return {"message": f"Successfully processed {count} loans from CSV."}
        
    except Exception as e:
        db.rollback() # Prevents stale database transactions if parsing errors happen
        logger.error(f"❌ Bulk Error: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk processing failed: {str(e)}")