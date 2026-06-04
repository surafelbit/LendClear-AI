import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/")
def get_risk_analytics(db: Session = Depends(get_db)):
    try:
        # 1. Fetch all records to calculate global metrics
        records = db.query(models.LoanRecord).all()
        total_apps = len(records)

        if total_apps == 0:
            return {
                "metrics": [
                    {"label": "Default Rate", "value": "0.0%", "trend": "0.0%", "up": True, "icon": "warning"},
                    {"label": "Avg. Risk Score", "value": "0.0", "trend": "0.0", "up": True, "icon": "analytics"},
                    {"label": "High-Risk Apps", "value": "0", "trend": "0", "up": True, "icon": "gpp_bad"},
                    {"label": "Model Accuracy", "value": "91.8%", "trend": "Stable", "up": True, "icon": "model_training"}
                ],
                "factors": []
            }

        # 2. Compute KPI Metrics
        rejected_count = sum(1 for r in records if r.status == "Rejected")
        high_risk_count = sum(1 for r in records if r.risk_tier == "Tier 3: High Risk")
        
        # Calculate Average Risk Score (Inverted confidence for rejections, scale 0-100)
        risk_scores = []
        for r in records:
            score = (1 - r.confidence) * 100 if r.status == "Rejected" else r.confidence * 100
            risk_scores.append(score)
        
        avg_risk_score = sum(risk_scores) / total_apps
        default_rate = (rejected_count / total_apps) * 100

        # 3. Dynamic Global Feature Importance (Aggregate SHAP Data)
        shap_aggregates = {}
        processed_shap_count = 0

        for r in records:
            if r.raw_shap_data and isinstance(r.raw_shap_data, dict):
                processed_shap_count += 1
                for feature, val in r.raw_shap_data.items():
                    shap_aggregates[feature] = shap_aggregates.get(feature, 0.0) + abs(float(val))

        factors_list = []
        if processed_shap_count > 0:
            # Find mean absolute impact per feature
            mean_shap = {k: v / processed_shap_count for k, v in shap_aggregates.items()}
            total_mean_impact = sum(mean_shap.values()) or 1.0

            # Scale to percentage contributions
            sorted_shap = sorted(mean_shap.items(), key=lambda x: x[1], reverse=True)
            for feature, mean_val in sorted_shap:
                percentage = (mean_val / total_mean_impact) * 100
                display_name = feature.replace("_", " ").title()
                factors_list.append({
                    "name": display_name,
                    "weight": round(percentage, 1)
                })
        else:
            # Fallback placeholder structure if no SHAP profiles exist yet
            factors_list = [
                {"name": "Credit Score", "weight": 0.0},
                {"name": "Income Level", "weight": 0.0},
                {"name": "Loan-To-Income", "weight": 0.0}
            ]

        return {
            "metrics": [
                {
                    "label": "Default Rate",
                    "value": f"{default_rate:.1f}%",
                    "trend": "-0.4%", # Mocked trend comparison or left neutral
                    "up": True,
                    "icon": "warning"
                },
                {
                    "label": "Avg. Risk Score",
                    "value": f"{avg_risk_score:.1f}",
                    "trend": "+1.2",
                    "up": False,
                    "icon": "analytics"
                },
                {
                    "label": "High-Risk Apps",
                    "value": str(high_risk_count),
                    "trend": "-5",
                    "up": True,
                    "icon": "gpp_bad"
                },
                {
                    "label": "Model Accuracy",
                    "value": "91.8%",
                    "trend": "+0.4%",
                    "up": True,
                    "icon": "model_training"
                }
            ],
            "factors": factors_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile analytics: {str(e)}")