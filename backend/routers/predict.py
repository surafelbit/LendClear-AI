# import logging
# import joblib
# import os
# import pandas as pd
# import shap
# import xgboost as xgb
# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from google import genai
# from database import get_db
# import models, schemas

# logger = logging.getLogger("lendclear.predict")
# router = APIRouter(prefix="/predict", tags=["Prediction"])

# # ── 1. ML Engine Load ──────────────────────────────────────────────────
# model = xgb.XGBClassifier()
# encoders = {}
# explainer = None

# try:
#     # Adjust paths if your script is running from the 'backend' folder
#     model.load_model("../ml_research/loan_model_xgb.json")
#     explainer = shap.TreeExplainer(model)
#     encoders = joblib.load("../ml_research/encoders.pkl")
#     logger.info("✅ ML Engine Online")
# except Exception as e:
#     logger.error(f"❌ ML Load Error: {e}")

# # ── 2. Gemini Client ──────────────────────────────────────────────────
# GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "your_key_here")
# gemini_client = genai.Client(api_key=GEMINI_KEY)

# # ── 3. The Controller ─────────────────────────────────────────────────
# @router.post("/")
# def predict_loan(application: schemas.LoanApplication, db: Session = Depends(get_db)):
#     try:
#         feature_names = ["city", "income", "credit_score", "loan_amount", "years_employed"]

#         # A. Encoding
#         city_int = 0
#         if "city" in encoders:
#             try:
#                 city_int = int(encoders["city"].transform([application.city])[0])
#             except:
#                 city_int = 0

#         # B. Data Prep
#         raw = {
#             "city": city_int,
#             "income": int(application.income),
#             "credit_score": int(application.credit_score),
#             "loan_amount": int(application.loan_amount),
#             "years_employed": int(application.years_employed),
#         }
#         df = pd.DataFrame([raw])[feature_names]

#         # C. Prediction
#         prediction = int(model.predict(df)[0])
#         probability = float(model.predict_proba(df)[0][1])
#         status = "Accepted" if prediction == 1 else "Rejected"

#         # D. SHAP logic
#         shap_values = explainer.shap_values(df)
#         impacts = dict(zip(feature_names, shap_values[0].tolist()))
#         sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)
#         top_reason_raw = sorted_impacts[0][0]
#         top_reason_display = top_reason_raw.replace("_", " ").title()

#         # E. Gemini AI Voice
#         ai_message = f"Decision based on {top_reason_display}."
#         if gemini_client:
#             try:
#                 prompt = (
#                     f"A loan application for someone with an income of {application.income} "
#                     f"and a credit score of {application.credit_score} was {status}. "
#                     f"The main deciding factor was {top_reason_display}. "
#                     f"Write a single professional sentence explaining this decision."
#                 )
#                 response = gemini_client.models.generate_content(
#                     model="gemini-2.0-flash",
#                     contents=prompt,
#                 )
#                 ai_message = response.text.strip()
#             except Exception as ai_err:
#                 logger.error(f"❌ Gemini error: {ai_err}")
#                 ai_message = f"Decision based on {top_reason_display}."
#         # if gemini_client:
#         #     prompt = (
#         #         f"A loan for {application.income} was {status}. "
#         #         f"Main factor: {top_reason_display}. "
#         #         "Explain this in one short, professional sentence."
#         #     )
#         #     response = gemini_client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
#         #     ai_message = response.text.strip()

#         # F. DB SAVE (Postgres)
#         new_record = models.LoanRecord(
#             city=application.city,
#             income=application.income,
#             credit_score=application.credit_score,
#             loan_amount=application.loan_amount,
#             years_employed=application.years_employed,
#             status=status,
#             top_reason=top_reason_display,
#             ai_voice_message=ai_message,
#             confidence=probability, # This is the 0.XX value
#             raw_shap_data=impacts
#         )
#         db.add(new_record)
#         db.commit()
#         db.refresh(new_record)

#         # G. THE COMPLETE RESPONSE (Matching your exact original keys)
#         return {
#             "id": new_record.id, # New: useful for frontend tracking
#             "approved": bool(prediction),
#             "status": status,
#             "confidence": round(probability, 2),
#             "top_reason": top_reason_display,
#             "ai_voice_message": ai_message,
#             "raw_data": impacts, # This is the 'raw_data' your frontend uses for charts
#         }

#     except Exception as e:
#         logger.error(f"❌ Error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))
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

logger = logging.getLogger("lendclear.predict")
router = APIRouter(prefix="/predict", tags=["Prediction"])

# ── 1. ML Engine Load ──────────────────────────────────────────────────
model = xgb.XGBClassifier()
encoders = {}
explainer = None

try:
    # Keep your existing paths
    model.load_model("../ml_research/loan_model_xgb.json")
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
    feature_names = ["city", "income", "credit_score", "loan_amount", "years_employed"]

    # A. Encoding
    city_int = 0
    if "city" in encoders:
        try:
            city_int = int(encoders["city"].transform([city])[0])
        except:
            city_int = 0

    # B. Data Prep
    raw = {
        "city": city_int,
        "income": int(income),
        "credit_score": int(credit_score),
        "loan_amount": int(loan_amount),
        "years_employed": int(years_employed),
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
        "ai_message": ai_message
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

        # DB SAVE
        new_record = models.LoanRecord(
            city=application.city,
            income=application.income,
            credit_score=application.credit_score,
            loan_amount=application.loan_amount,
            years_employed=application.years_employed,
            status=result["status"],
            top_reason=result["top_reason"],
            ai_voice_message=result["ai_message"],
            confidence=result["probability"],
            raw_shap_data=result["impacts"]
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return {
            "id": new_record.id,
            "approved": bool(result["prediction"]),
            "status": result["status"],
            "confidence": round(result["probability"], 2),
            "top_reason": result["top_reason"],
            "ai_voice_message": result["ai_message"],
            "raw_data": result["impacts"],
        }
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── 5. Bulk Prediction Endpoint (NEW) ────────────────────────────────
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
            # Cast strings from CSV to numbers
            res = run_internal_prediction(
                city=row.get('city', 'Unknown'),
                income=float(row['income']),
                credit_score=float(row['credit_score']),
                loan_amount=float(row['loan_amount']),
                years_employed=float(row['years_employed'])
            )

            # Save each row to DB
            db_record = models.LoanRecord(
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
            )
            db.add(db_record)
            count += 1

        db.commit()
        return {"message": f"Successfully processed {count} loans from CSV."}
        
    except Exception as e:
        logger.error(f"❌ Bulk Error: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk processing failed: {str(e)}")