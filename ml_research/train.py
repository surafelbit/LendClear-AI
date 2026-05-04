import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

# 1. Load Data
df = pd.read_csv('loan_approval.csv')

# 2. Preprocessing
# Fill missing values
df = df.ffill()

# Convert text (city, name, etc.) to numbers so the model can read them
le = LabelEncoder()
for col in df.select_dtypes(include=['object']).columns:
    df[col] = le.fit_transform(df[col])

# 3. Split Data
# According to your image:
# We drop 'name' because it's just an ID/label, not a risk factor.
# We set 'loan_approved' as our Target (y).
X = df.drop(['loan_approved', 'name'], axis=1) 
y = df['loan_approved']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Train XGBoost (The "Gradient Boosting" Edge)
# This builds sequential trees to fix errors from previous ones[cite: 1, 2]
model = xgb.XGBClassifier(n_estimators=100, learning_rate=0.1)
model.fit(X_train, y_train)

# 5. Save the Brain
# We save as JSON for the best compatibility with your FastAPI backend
model.save_model("loan_model_xgb.json")

print("Success! Model trained using your specific columns and saved.")