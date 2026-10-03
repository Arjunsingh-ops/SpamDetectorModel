import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

df = pd.read_csv("real_calls.csv")
print(df["label"].value_counts())

vectorizer = TfidfVectorizer()

X = vectorizer.fit_transform(df["conversation"])
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = LogisticRegression(max_iter=1000)

model.fit(X_train, y_train)

print("Model trained successfully!")
from sklearn.metrics import accuracy_score

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("Accuracy:", accuracy)

new_call = [
    "Hello, your bank account will be blocked today. Please tell me the OTP you received."
]

new_call_vector = vectorizer.transform(new_call)

prediction = model.predict(new_call_vector)

import joblib

joblib.dump(model, "spam_model.pkl")
joblib.dump(vectorizer, "tfidf_vectorizer.pkl")
print("Model and vectorizer saved!")

if prediction[0] == 1:
    print("[SPAM / SCAM]")
else:
    print("[NORMAL]")

print("\nExample NORMAL conversation:")
print(df[df["label"] == 0]["conversation"].iloc[0])

print("\nExample SPAM conversation:")
print(df[df["label"] == 1]["conversation"].iloc[0])