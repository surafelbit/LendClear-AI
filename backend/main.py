from fastapi import FastAPI
import xgboost as xgb
import pandas as pd
import shap
import google.generativeai as genai
from pydantic import BaseModel

# 1. Initialize FastAPI
app = FastAPI(title="LendClear AI API")

# 2. Configure Gemini "Voice"
# Get your key from: https://aistudio.google.com/
genai.configure(api_key="AIzaSyB7T0LBMV82nzcCnHczSBpBaqsynELDR-U")
llm_model = genai.GenerativeModel('gemini-1.5-flash')

# 3. Load the "Brain"
model = xgb.XGBClassifier()
try:
    model.load_model("../ml_research/loan_model_xgb.json")
    explainer = shap.TreeExplainer(model)
    print("✅ System Ready: Brain and Voice are online.")
except Exception as e:
    print(f"❌ Error loading: {e}")

class LoanApplication(BaseModel):
    city: int
    income: float
    credit_score: float
    loan_amount: float
    years_employed: float
    points: float

@app.post("/predict")
def predict_loan(application: LoanApplication):
    try:
        data_dict = application.model_dump()
        data = pd.DataFrame([data_dict])
        
        # --- The Brain Thinking ---
        prediction = int(model.predict(data)[0])
        probability = float(model.predict_proba(data)[0][1])
        status = "Accepted" if prediction == 1 else "Rejected"

        # --- The Detective Investigating ---
        shap_values = explainer.shap_values(data)
        feature_names = data.columns
        impacts = dict(zip(feature_names, shap_values[0].tolist()))
        sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reason = sorted_impacts[0][0].replace("_", " ").title()

        # --- The Voice Speaking ---
        prompt = f"""
        Context: A loan application was {status}.
        Primary Factor: {top_reason}.
        Details: Income is {application.income}, Credit Score is {application.credit_score}.
        
        Task: Write a 1-sentence, professional, and encouraging explanation for the user. 
        If rejected, suggest one small improvement.
        """
        response = llm_model.generate_content(prompt)
        ai_message = response.text.strip()

        return {
            "approved": bool(prediction),
            "status": status,
            "confidence": round(probability, 2),
            "top_reason": top_reason,
            "ai_voice_message": ai_message, # This is the LLM output!
            "raw_data": impacts
        }
    except Exception as e:
        return {"error": str(e)}