# import pandas as pd
# import xgboost as xgb
# import joblib
# import os
# from sklearn.model_selection import train_test_split
# from sklearn.preprocessing import LabelEncoder
# from sklearn.metrics import accuracy_score, classification_report

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# # 1. Load Data
# df = pd.read_csv(os.path.join(BASE_DIR, 'loan_approval.csv'))
# df = df.ffill()

# # 2. Fix target column FIRST
# df['loan_approved'] = df['loan_approved'].map({'True': 1, 'False': 0, True: 1, False: 0}).astype(int)
# print("Target distribution:")
# print(df['loan_approved'].value_counts())

# # 3. Encode string columns (skip loan_approved)
# encoders = {}
# for col in df.select_dtypes(include=['object', 'str']).columns:
#     if col == 'loan_approved':
#         continue
#     le = LabelEncoder()
#     df[col] = le.fit_transform(df[col])
#     encoders[col] = le

# joblib.dump(encoders, os.path.join(BASE_DIR, 'encoders.pkl'))
# print("✅ Encoders saved")

# # 4. Split — DROP points and name, they cheat/are irrelevant
# X = df.drop(['loan_approved', 'name', 'points'], axis=1)
# y = df['loan_approved']

# print("Features used:", list(X.columns))
# print("y unique values:", y.unique())

# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# # 5. Train with better hyperparameters
# model = xgb.XGBClassifier(
#     n_estimators=200,
#     learning_rate=0.05,
#     max_depth=5,
#     min_child_weight=3,
#     subsample=0.8,
#     colsample_bytree=0.8,
#     eval_metric='logloss',
#     random_state=42
# )
# model.fit(X_train, y_train)

# # 6. Evaluate properly
# y_pred = model.predict(X_test)
# print(f"\n✅ Accuracy: {accuracy_score(y_test, y_pred):.1%}")
# print("\nDetailed Report:")
# print(classification_report(y_test, y_pred, target_names=['Rejected', 'Approved']))

# # 7. Show feature importance
# importance = dict(zip(X.columns, model.feature_importances_))
# sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)
# print("\nFeature Importance:")
# for feat, imp in sorted_imp:
#     print(f"  {feat}: {imp:.3f}")

# # 8. Save
# model.save_model(os.path.join(BASE_DIR, 'loan_model_xgb.json'))
# print("\n✅ Model saved")
import pandas as pd
import xgboost as xgb
import joblib
import os
import shap
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Load Data
print("📊 Loading dataset...")
df = pd.read_csv(os.path.join(BASE_DIR, 'loan_approval.csv'))
df = df.ffill()

# 2. Fix target column FIRST
df['loan_approved'] = df['loan_approved'].map({'True': 1, 'False': 0, True: 1, False: 0}).astype(int)
print("\nTarget distribution:")
print(df['loan_approved'].value_counts())

# 3. ADVANCED FEATURE ENGINEERING (Smarter Inputs)
print("\n⚙️ Engineering advanced features...")
# Debt-to-Income (DTI) Ratio
df['dti_ratio'] = df['loan_amount'] / (df['income'] + 1)
# Stability Index (Years Employed scaled by Credit Score)
df['stability_index'] = df['years_employed'] * df['credit_score']

# 4. Encode string columns (skip loan_approved)
encoders = {}
for col in df.select_dtypes(include=['object', 'str']).columns:
    if col in ['loan_approved', 'name', 'points']: 
        continue # Skip target and dropped columns
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

joblib.dump(encoders, os.path.join(BASE_DIR, 'encoders.pkl'))
print("✅ Encoders saved")

# 5. Split Data — DROP points and name (Irrelevant/Cheating)
X = df.drop(['loan_approved', 'name', 'points'], axis=1)
y_class = df['loan_approved']

print("\nFeatures used for training:", list(X.columns))

# ─── PART A: THE RISK TIER CLASSIFIER ─────────────────────────────────────────
print("\n🧠 Training Classification Model (Risk Tiers)...")
X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X, y_class, test_size=0.2, random_state=42)

clf_model = xgb.XGBClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=5,
    min_child_weight=3,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric='logloss',
    random_state=42
)
clf_model.fit(X_train_c, y_train_c)

y_pred_c = clf_model.predict(X_test_c)
print(f"✅ Classification Accuracy: {accuracy_score(y_test_c, y_pred_c):.1%}")
print(classification_report(y_test_c, y_pred_c, target_names=['Rejected', 'Approved']))

clf_model.save_model(os.path.join(BASE_DIR, 'loan_model_xgb.json'))

# Save SHAP explainer for the dashboard graphs
explainer = shap.TreeExplainer(clf_model)
joblib.dump(explainer, os.path.join(BASE_DIR, 'shap_explainer.pkl'))
print("✅ Classifier & SHAP Explainer saved")


# ─── PART B: THE MAXIMUM SAFE LOAN REGRESSOR ──────────────────────────────────
print("\n📈 Training Regression Model (Safe Loan Amount Recommendations)...")
# Filter data to ONLY include historically approved loans
approved_df = df[df['loan_approved'] == 1].copy()

# For the regressor, the target is the actual loan amount that was successfully approved
X_reg = approved_df.drop(['loan_approved', 'name', 'points', 'loan_amount', 'dti_ratio'], axis=1)
y_reg = approved_df['loan_amount']

X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X_reg, y_reg, test_size=0.2, random_state=42)

reg_model = xgb.XGBRegressor(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=4,
    random_state=42
)
reg_model.fit(X_train_r, y_train_r)

y_pred_r = reg_model.predict(X_test_r)
mae = mean_absolute_error(y_test_r, y_pred_r)
print(f"✅ Regression Model MAE: ${mae:,.2f} (Average margin of error for loan recommendations)")

reg_model.save_model(os.path.join(BASE_DIR, 'loan_amount_regressor_xgb.json'))
print("✅ Regressor saved")

print("\n🚀 Full Multi-Model Pipeline Complete.")