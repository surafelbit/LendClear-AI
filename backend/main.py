import logging
import joblib
import os
import pandas as pd
import shap
import xgboost as xgb
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel
from database import engine, Base
from routers import predict, history
Base.metadata.create_all(bind=engine)

# ── 1. App setup ──────────────────────────────────────────────────────────────
app = FastAPI(title="LendClear AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 2. Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lendclear.debug")
logging.getLogger("httpx").setLevel(logging.WARNING)

# ── 3. Gemini client ──────────────────────────────────────────────────────────
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "your_gemini_api_key_here")

try:
    gemini_client = genai.Client(api_key=GEMINI_KEY)
    logger.info("📡 Gemini Client ready.")
except Exception as init_err:
    logger.error(f"❌ Gemini init failed: {init_err}")
    gemini_client = None

# ── 4. Load ML model + encoders ───────────────────────────────────────────────
model = xgb.XGBClassifier()
encoders = {}

try:
    model.load_model("../ml_research/loan_model_xgb.json")
    explainer = shap.TreeExplainer(model)
    logger.info("✅ XGBoost model loaded.")
except Exception as e:
    logger.error(f"❌ Model load failed: {e}")

try:
    encoders = joblib.load("../ml_research/encoders.pkl")
    logger.info(f"✅ Encoders loaded: {list(encoders.keys())}")
except Exception as e:
    logger.warning(f"⚠️  No encoders file found — city must be sent as an integer: {e}")

# ── 5. Request schema ─────────────────────────────────────────────────────────
class LoanApplication(BaseModel):
    city: str           # Accept city as a string name, e.g. "East Jill"
    income: float
    credit_score: float
    loan_amount: float
    years_employed: float
    
app.include_router(predict.router)
app.include_router(history.router)
# ── 6. Predict endpoint ───────────────────────────────────────────────────────
@app.post("/predict")
def predict_loan(application: LoanApplication):
    try:
        feature_names = ["city", "income", "credit_score", "loan_amount", "years_employed"]

        # Convert city name → encoded integer using the saved encoder
        city_int = 0
        if "city" in encoders:
            try:
                city_int = int(encoders["city"].transform([application.city])[0])
            except ValueError:
                # City not seen during training — use 0 and warn
                logger.warning(f"⚠️  Unknown city '{application.city}', defaulting to 0")
                city_int = 0
        else:
            logger.warning("⚠️  No city encoder found, treating city as 0")

        # Build the dataframe with correct types matching training
        raw = {
            "city":           city_int,
            "income":         int(application.income),
            "credit_score":   int(application.credit_score),
            "loan_amount":    int(application.loan_amount),
            "years_employed": int(application.years_employed),
        }

        df = pd.DataFrame([raw])[feature_names]
        logger.info(f"🔍 Raw input: {raw}")
        logger.info(f"🔍 DataFrame:\n{df}")
        logger.info(f"🔍 DataFrame dtypes:\n{df.dtypes}")
        logger.info(f"🔍 Model feature names: {model.get_booster().feature_names}")
        # ── END DEBUG ──

        prediction  = int(model.predict(df)[0])
        logger.info(f"🔍 Input to model:\n{df.to_dict(orient='records')}")

        # ── Prediction ──
        prediction  = int(model.predict(df)[0])
        probability = float(model.predict_proba(df)[0][1])
        status      = "Accepted" if prediction == 1 else "Rejected"

        # ── SHAP explanation ──
        shap_values  = explainer.shap_values(df)
        impacts      = dict(zip(feature_names, shap_values[0].tolist()))
        sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)
        top_reason   = sorted_impacts[0][0].replace("_", " ").title()

        logger.info(f"📊 Prediction={status}, Confidence={probability:.2f}, TopReason={top_reason}")

        # ── Gemini voice message ──
        ai_message = f"Decision based on {top_reason}."
        if gemini_client:
            try:
                prompt = (
                    f"A loan application for someone with an income of {application.income} "
                    f"and a credit score of {application.credit_score} was {status}. "
                    f"The main deciding factor was {top_reason}. "
                    f"Write a single professional sentence explaining this decision."
                )
                response = gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                )
                ai_message = response.text.strip()
            except Exception as ai_err:
                logger.error(f"❌ Gemini error: {ai_err}")
                ai_message = f"Decision based on {top_reason}."

        return {
            "approved":        bool(prediction),
            "status":          status,
            "confidence":      round(probability, 2),
            "top_reason":      top_reason,
            "ai_voice_message": ai_message,
            "raw_data":        impacts,
        }

    except Exception as e:
        logger.error(f"❌ Pipeline crash: {e}", exc_info=True)
        return {"error": f"Pipeline crash: {str(e)}"}