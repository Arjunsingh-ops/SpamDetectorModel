from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI()

# Load ML model and TF-IDF vectorizer
model = joblib.load("spam_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

# Load spam-number database
spam_data = pd.read_csv("spam_numbers.csv")

spam_data["phone_number"] = (
    spam_data["phone_number"]
    .astype(str)
    .str.replace("+", "", regex=False)
    .str.strip()
)
spam_numbers = set(spam_data["phone_number"])
print("Spam numbers:")
print(spam_numbers)


class CallData(BaseModel):
    phone_number: str
    conversation: str


@app.get("/")
def home():
    return {
        "message": "Spam Call Detector API is running"
    }


@app.post("/predict")
def predict(data: CallData):
    phone_number = (
    data.phone_number
    .replace("+", "")
    .strip()
    )
    if phone_number in spam_numbers:

        number_info = spam_data[
            spam_data["phone_number"] == phone_number
        ].iloc[0]

        reports = int(number_info["reports"])
        category = number_info["category"]

        confidence = min(0.50 + (reports / 100), 0.99)

        return {
            "classification": "SPAM / SCAM",
            "confidence": round(confidence, 2),
            "reason": f"Known number: {category}",
            "reports": reports
        }

    # --------------------------------
    # STEP 2: Analyze conversation
    # --------------------------------
    text_vector = vectorizer.transform(
        [data.conversation]
    )

    prediction = model.predict(text_vector)
    probabilities = model.predict_proba(text_vector)

    confidence = max(probabilities[0])

    if prediction[0] == 1:
        result = "SPAM / SCAM"
    else:
        result = "NORMAL"

    return {
        "classification": result,
        "confidence": round(float(confidence), 2),
        "reason": "Conversation analysis"
    }