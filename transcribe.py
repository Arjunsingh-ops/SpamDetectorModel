import speech_recognition as sr

recognizer = sr.Recognizer()

with sr.AudioFile("test.wav") as source:
    audio = recognizer.record(source)

try:
    result = recognizer.recognize_google_cloud(
        audio,
        language="hi-IN"
    )

    print("Transcription:")
    print(result)

except Exception as e:
    print("Error:", e)