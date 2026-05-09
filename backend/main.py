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
app.include_router(predict.router)
app.include_router(history.router)

@app.get("/")
def home():
    return {"message": "LendClear API is modular and ready."}
