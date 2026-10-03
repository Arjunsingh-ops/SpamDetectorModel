MODEL_NAME = "Helsinki-NLP/opus-mt-hi-en"
_tokenizer = None
_model = None

def _get_model():
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        try:
            from transformers import MarianMTModel, MarianTokenizer
            _tokenizer = MarianTokenizer.from_pretrained(MODEL_NAME)
            _model = MarianMTModel.from_pretrained(MODEL_NAME)
        except Exception as e:
            print(f"Translation model failed to load ({e}). Using raw text fallback.")
            return None, None
    return _tokenizer, _model

def translate_to_english(text: str) -> str:
    tokenizer, model = _get_model()
    if tokenizer is None or model is None:
        return text
    try:
        tokens = tokenizer(text, return_tensors="pt", padding=True)
        translated = model.generate(**tokens)
        return tokenizer.decode(translated[0], skip_special_tokens=True)
    except Exception as e:
        print(f"Translation error: {e}")
        return text

