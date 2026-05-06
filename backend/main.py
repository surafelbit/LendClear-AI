import logging
from fastapi import FastAPI
import xgboost as xgb
import pandas as pd
import shap
from google import genai
from google.genai.errors import APIError
from pydantic import BaseModel
import os
# 1. Initialize FastAPI
app = FastAPI(title="LendClear AI API")

# ==========================================
# 2. DEBUGGING & LOGGING ENGINE SETUP
# ==========================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lendclear.debug")
# Set the underlying http transport library (httpx) to show you connection blocks
logging.getLogger("httpx").setLevel(logging.WARNING) 

# Configure Modern Gemini Client
GEMINI_KEY = "my api key"

try:
    # Initialize the client context
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    logger.info("📡 Google GenAI Client wrapper successfully built.")
except Exception as init_err:
    logger.error(f"❌ Client Initialization Failed: {init_err}")
    client = None

# 3. Load the Machine Learning "Brain"
model = xgb.XGBClassifier()
try:
    model.load_model("../ml_research/loan_model_xgb.json")
    explainer = shap.TreeExplainer(model)
    print("✅ System Ready: XGBoost Brain and Gemini Voice are online.")
except Exception as e:
    print(f"❌ Error loading ML engine: {e}")

class LoanApplication(BaseModel):
    city: int
    income: float
    credit_score: float
    loan_amount: float
    years_employed: float
    points: float

# 5. Core API Routing
@app.post("/predict")
def predict_loan(application: LoanApplication):
    try:
        data_dict = application.model_dump()
        data = pd.DataFrame([data_dict])
        
        # --- Step A: The Brain Thinking ---
        prediction = int(model.predict(data)[0])
        probability = float(model.predict_proba(data)[0][1])
        status = "Accepted" if prediction == 1 else "Rejected"

        # --- Step B: The Detective Investigating ---
        shap_values = explainer.shap_values(data)
        feature_names = data.columns
        impacts = dict(zip(feature_names, shap_values[0].tolist()))
        sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reason = sorted_impacts[0][0].replace("_", " ").title()

        # --- Step C: The Voice Speaking (With Debug Layer) ---
        prompt = f"Context: Loan {status}. Factor: {top_reason}. Income: {application.income}."
        
        ai_message = ""
        if client:
            try:
                # 🔴 DEBUG PRINT: See what you are sending BEFORE it leaves your machine
                logger.info(f"🚀 Outgoing Prompt to Google: {prompt.strip()}")
                
                response = client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt
                )
                ai_message = response.text.strip()
                
                # 🟢 DEBUG PRINT: Confirm a clean response arrived
                logger.info("✅ Successful response received from gemini-2.0-flash.")
                
            except APIError as api_err:
                # ⚠️ THE TRAP: Catch exact status codes (429 Quota / 403 Keys / 404 Missing)
                logger.error("❌ --- GOOGLE API ERROR ENCOUNTERED ---")
                logger.error(f"Status Code: {api_err.code}")
                logger.error(f"Error Message: {api_err.message}")
                logger.error("---------------------------------------")
                
                ai_message = f"Decision: {top_reason}. (LLM module returned code {api_err.code})."
                
            except Exception as inner_err:
                logger.error(f"⚠️ Non-API Connectivity issue: {inner_err}")
                ai_message = f"Decision: {top_reason}. (LLM offline)."
        else:
            ai_message = f"Decision: {top_reason}. (Client unconfigured)."

        return {
            "approved": bool(prediction),
            "status": status,
            "confidence": round(probability, 2),
            "top_reason": top_reason,
            "ai_voice_message": ai_message,
            "raw_data": impacts
        }
        
    except Exception as e:
        return {"error": f"Internal pipeline crash: {str(e)}"}