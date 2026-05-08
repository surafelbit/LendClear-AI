import pandas as pd
import xgboost as xgb
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Load Data
df = pd.read_csv(os.path.join(BASE_DIR, 'loan_approval.csv'))
df = df.ffill()

# 2. Fix target column FIRST
df['loan_approved'] = df['loan_approved'].map({'True': 1, 'False': 0, True: 1, False: 0}).astype(int)
print("Target distribution:")
print(df['loan_approved'].value_counts())

# 3. Encode string columns (skip loan_approved)
encoders = {}
for col in df.select_dtypes(include=['object', 'str']).columns:
    if col == 'loan_approved':
        continue
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

joblib.dump(encoders, os.path.join(BASE_DIR, 'encoders.pkl'))
print("✅ Encoders saved")

# 4. Split — DROP points and name, they cheat/are irrelevant
X = df.drop(['loan_approved', 'name', 'points'], axis=1)
y = df['loan_approved']

print("Features used:", list(X.columns))
print("y unique values:", y.unique())

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. Train with better hyperparameters
model = xgb.XGBClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=5,
    min_child_weight=3,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric='logloss',
    random_state=42
)
model.fit(X_train, y_train)

# 6. Evaluate properly
y_pred = model.predict(X_test)
print(f"\n✅ Accuracy: {accuracy_score(y_test, y_pred):.1%}")
print("\nDetailed Report:")
print(classification_report(y_test, y_pred, target_names=['Rejected', 'Approved']))

# 7. Show feature importance
importance = dict(zip(X.columns, model.feature_importances_))
sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)
print("\nFeature Importance:")
for feat, imp in sorted_imp:
    print(f"  {feat}: {imp:.3f}")

# 8. Save
model.save_model(os.path.join(BASE_DIR, 'loan_model_xgb.json'))
print("\n✅ Model saved")