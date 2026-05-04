from fastapi import FastAPI
import xgboost as xgb
import pandas as pd
from pydantic import BaseModel

# 1. Initialize FastAPI
app = FastAPI(title="LendClear AI API")

# 2. Load the "Brain"
# We use the native XGBoost loader for the .json file we created
model = xgb.XGBClassifier()
model.load_model("../ml_research/loan_model_xgb.json")

# 3. Define the Data Structure (Matches your CSV columns)
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

@app.post("/predict")
def predict_loan(app: LoanApplication):
    # Convert incoming JSON data into a DataFrame for the model
    data = pd.DataFrame([app.dict()])
    
    # Make the prediction
    prediction = model.predict(data)[0]
    probability = model.predict_proba(data)[0][1] # Probability of approval

    return {
        "approved": bool(prediction),
        "confidence_score": round(float(probability), 2),
        "status": "Accepted" if prediction == 1 else "Rejected"
    }