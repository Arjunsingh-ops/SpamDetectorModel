import joblib

model = joblib.load("spam_model.pkl")
vectorizer = joblib.load("tfidf_vectorizer.pkl")

test_calls = [
    "Hello, I'm calling to confirm your appointment for tomorrow.",
    "Your bank account will be blocked today. Please give me your OTP.",
    "We are calling to offer you a free smart meter installation.",
    "You have won a lottery prize. Please provide your bank details and pay a processing fee.",
    "Hello, I wanted to confirm your booking for tomorrow."
]

for conversation in test_calls:
    text_vector = vectorizer.transform([conversation])
    prediction = model.predict(text_vector)

    if prediction[0] == 1:
        result = "SPAM / SCAM"
    else:
        result = "NORMAL"

    print(f"\n{conversation}")
    print(f" -> {result}")