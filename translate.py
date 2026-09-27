from transformers import MarianMTModel, MarianTokenizer

MODEL_NAME = "Helsinki-NLP/opus-mt-hi-en"

tokenizer = MarianTokenizer.from_pretrained(MODEL_NAME)
model = MarianMTModel.from_pretrained(MODEL_NAME)


def translate_to_english(text):
    tokens = tokenizer(text, return_tensors="pt", padding=True)

    translated = model.generate(**tokens)

    return tokenizer.decode(
        translated[0],
        skip_special_tokens=True
    )
