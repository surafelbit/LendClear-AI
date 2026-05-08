import pandas as pd
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# 1. Load Data
df = pd.read_csv('ml_research/loan_approval.csv')
df = df.ffill()

# Fix: convert loan_approved to proper integer before anything else
df['loan_approved'] = df['loan_approved'].map({'True': 1, 'False': 0, True: 1, False: 0}).astype(int)
print("Target distribution:")
print(df['loan_approved'].value_counts())
# Verify
print("loan_approved unique values:", df['loan_approved'].unique())

print(df['loan_approved'].value_counts())

# 2. Preprocessing
df = df.ffill()

# Encode all object columns and SAVE the city encoder
encoders = {}
# NEW - exclude loan_approved since we already handled it
for col in df.select_dtypes(include=['object', 'str']).columns:
    if col == 'loan_approved':
        continue
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

# Save all encoders so FastAPI can use the same mapping
joblib.dump(encoders, 'encoders.pkl')
print("✅ Encoders saved to encoders.pkl")

# 3. Split Data
X = df.drop(['loan_approved', 'name'], axis=1)
y = df['loan_approved']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Train XGBoost
model = xgb.XGBClassifier(
    n_estimators=100,
    learning_rate=0.1,
    scale_pos_weight=3  # increase this if approvals are rare in your data
)
print(y.value_counts())
print(f"Approval rate: {y.mean():.1%}")
model.fit(X_train, y_train)


from sklearn.metrics import accuracy_score
y_pred = model.predict(X_test)
print(f"✅ Accuracy: {accuracy_score(y_test, y_pred):.1%}")

# 7. Save
# Save the Brain to the specific folder
model.save_model("ml_research/loan_model_xgb.json")
print("✅ Model saved")
# 5. Save the model

print("✅ Model trained and saved to loan_model_xgb.json")
print(f"   Training columns: {list(X.columns)}")