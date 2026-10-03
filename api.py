from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from translate import translate_to_english
import joblib
import pandas as pd
import csv

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Load ML model and TF-IDF vectorizer
model = joblib.load("spam_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

# Load spam-number database
spam_data = pd.read_csv("spam_numbers.csv")

def normalize_phone_number(phone_number):
    return "".join(
        character
        for character in str(phone_number)
        if character.isdigit()
    )

spam_data["phone_number"] = (
    spam_data["phone_number"]
    .astype(str)
    .apply(normalize_phone_number)
)
spam_numbers = set(spam_data["phone_number"])

def add_spam_number(phone_number, category="conversation detected"):
    global spam_data, spam_numbers

    if phone_number not in spam_numbers:

        new_row = pd.DataFrame([{
            "phone_number": phone_number,
            "category": category,
            "reports": 1
        }])

        new_row.to_csv(
            "spam_numbers.csv",
            mode="a",
            header=False,
            index=False
        )

        # Update memory as well
        spam_data = pd.concat(
            [spam_data, new_row],
            ignore_index=True
        )

        spam_numbers.add(phone_number)

print("Spam numbers:")
print(spam_numbers)


class CallData(BaseModel):
    phone_number: str
    conversation: str
    language: str = "en"


@app.get("/")
def home():
    return {
        "message": "Spam Call Detector API is running"
    }

def get_spam_reason(text):
    text = text.lower()

    indicators = {
        "otp": "The conversation asks for an OTP or verification code.",
        "one-time password": "The conversation asks for an OTP or verification code.",
        "bank account": "The conversation involves sensitive bank account information.",
        "bank details": "The conversation asks for sensitive banking details.",
        "credit card": "The conversation involves sensitive credit card information.",
        "debit card": "The conversation involves sensitive debit card information.",
        "password": "The conversation asks for a password or other sensitive credential.",
        "processing fee": "The conversation asks for a processing fee or payment.",
        "lottery": "The conversation contains a lottery or prize-related offer.",
        "prize": "The conversation contains a prize-related offer.",
        "urgent": "The conversation uses urgency to pressure the recipient.",
        "verify your account": "The conversation asks the recipient to verify an account.",
    }

    reasons = []

    for keyword, reason in indicators.items():
        if keyword in text and reason not in reasons:
            reasons.append(reason)

    if reasons:
        return " ".join(reasons)

    return "The conversation contains patterns associated with spam or scam calls."

@app.get("/flagged-numbers")
def get_flagged_numbers():
    numbers = []

    with open("spam_numbers.csv", "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            numbers.append(row)

    return {"numbers": numbers}

@app.post("/predict")
def predict(data: CallData):
    phone_number = normalize_phone_number(data.phone_number)
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
    if data.language.lower() == "hi":
        data.conversation = translate_to_english(data.conversation)
        print("Translated text:", data.conversation)

    spam_keywords = [
    "lottery",
    "won",
    "jackpot",
    "million dollar",
    "billion dollar",
    "click the link"
    ]

    conversation_lower = data.conversation.lower()

    if any(keyword in conversation_lower for keyword in spam_keywords):
        prediction = [1]
        confidence = 0.99
    else:
        text_vector = vectorizer.transform([data.conversation])

        prediction = model.predict(text_vector)

        probabilities = model.predict_proba(text_vector)

        confidence = max(probabilities[0])

    if prediction[0] == 1:
        result = "SPAM / SCAM"

        spam_reason = get_spam_reason(data.conversation)

        add_spam_number(
            phone_number,
            "conversation detected"
        )
    else:
        result = "NORMAL"
        spam_reason = None

    return {
    "classification": result,
    "confidence": round(float(confidence), 2),
    "reason": "Conversation analysis",
    "details": spam_reason
    }