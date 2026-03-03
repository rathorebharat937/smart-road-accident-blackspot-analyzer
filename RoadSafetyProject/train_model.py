import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Load dataset
df = pd.read_csv("indian_accident_processed.csv")

print("Dataset Loaded Successfully ✅")
print(df.head())

# Encode Road_Type
le_road = LabelEncoder()
df['Road_Type'] = le_road.fit_transform(df['Road_Type'])

# Encode Target
le_risk = LabelEncoder()
df['Risk_Level'] = le_risk.fit_transform(df['Risk_Level'])

# Select features (UPDATED FOR YOUR DATASET)
X = df[['Total_Accidents', 
        'Night_Accidents', 
        'Rain_Accidents', 
        'Deaths',
        'Injured',
        'Road_Type']]

y = df['Risk_Level']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print("Model Trained Successfully ✅")

# Predictions
y_pred = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, y_pred)
print("Model Accuracy:", accuracy)

print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(model, "risk_model.pkl")
joblib.dump(le_road, "road_encoder.pkl")
joblib.dump(le_risk, "risk_encoder.pkl")

print("Model and encoders saved successfully ✅")