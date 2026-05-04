from fastapi import FastAPI
import xgboost as xgb
import pandas as pd
from pydantic import BaseModel
import shap

# 1. Initialize FastAPI
app = FastAPI(title="LendClear AI API")

# 2. Load the "Brain"
model = xgb.XGBClassifier()
try:
    model.load_model("../ml_research/loan_model_xgb.json")
    explainer = shap.TreeExplainer(model)
    print("✅ Model and SHAP Explainer loaded successfully.")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# 3. Define the Data Structure
class LoanApplication(BaseModel):
    city: int
    income: float
    credit_score: float
    loan_amount: float
    years_employed: float
    points: float

@app.get("/")
def home():
    return {"status": "LendClear API is Online"}

@app.post("/predict") # Fixed: changed 'fastapi_app' to 'app'
def predict_loan(application: LoanApplication):
    try:
        data_dict = application.model_dump()
        data = pd.DataFrame([data_dict])
        
        # 1. Get the Prediction
        prediction = int(model.predict(data)[0])
        probability = float(model.predict_proba(data)[0][1])

        # 2. Get the "Why" (SHAP Values)
        shap_values = explainer.shap_values(data)
        
        feature_names = data.columns
        # .tolist() is critical here for the JSON response to work
        impacts = dict(zip(feature_names, shap_values[0].tolist())) 
        
        # Sort features by impact
        sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reason = sorted_impacts[0][0] 

        return {
            "approved": bool(prediction),
            "confidence_score": round(probability, 2),
            "status": "Accepted" if prediction == 1 else "Rejected",
            "top_reason": top_reason.replace("_", " ").title(),
            "explanation_data": impacts 
        }
    except Exception as e:
        return {"error": str(e)}