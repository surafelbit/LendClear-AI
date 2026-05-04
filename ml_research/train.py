import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

# 1. Load Data
df = pd.read_csv('loan_prediction.csv')

# 2. Simple Preprocessing
# Fill missing values and convert text to numbers
df = df.fillna(method='ffill')
le = LabelEncoder()
for col in df.select_dtypes(include=['object']).columns:
    df[col] = le.fit_transform(df[col])

# 3. Split Data
# 'Loan_Status' is our target (Approved=1, Rejected=0)
X = df.drop(['Loan_Status', 'Loan_ID'], axis=1)
y = df['Loan_Status']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Train XGBoost (The "Gradient Boosting" Edge)
model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.1)
model.fit(X_train, y_train)

# 5. Save the Brain
# We save as a JSON for the best compatibility with FastAPI
model.save_model("loan_model_xgb.json")
print("Model trained and saved as loan_model_xgb.json!")