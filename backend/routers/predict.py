from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import xgboost as xgb
import pandas as pd
import shap
import os
from google import genai

router = APIRouter(prefix="/predict", tags=["Prediction"])

# Initialize ML & AI once
model = xgb.XGBClassifier()
model.load_model("../ml_research/loan_model_xgb.json")
explainer = shap.TreeExplainer(model)
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/")
def predict_loan(app_data: schemas.LoanApplication, db: Session = Depends(get_db)):
    try:
        # 1. Prepare Data
        feature_names = ["city", "income", "credit_score", "loan_amount", "years_employed", "points"]
        df = pd.DataFrame([app_data.model_dump()])[feature_names]
        
        # 2. ML Prediction
        prediction = int(model.predict(df)[0])
        status = "Accepted" if prediction == 1 else "Rejected"
        
        # 3. SHAP Interpretation
        shap_vals = explainer.shap_values(df)
        impacts = dict(zip(feature_names, shap_vals[0].tolist()))
        top_reason = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)[0][0]

        # 4. Gemini Voice
        prompt = f"Explain why a loan with {status} status and top factor {top_reason} was decided. Be brief."
        response = client.models.generate_content(model='gemini-2.0-flash', contents=prompt)
        ai_msg = response.text.strip()

        # 5. SAVE TO POSTGRES
        new_record = models.LoanRecord(
            **app_data.model_dump(),
            status=status,
            top_reason=top_reason.replace("_", " ").title(),
            ai_voice_message=ai_msg,
            raw_shap_data=impacts
        )
        db.add(new_record)
        db.commit()

        return {"status": status, "reason": top_reason, "ai_message": ai_msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))