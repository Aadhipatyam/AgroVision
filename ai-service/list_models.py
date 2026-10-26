import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

SKIP = ("live", "audio", "tts", "image", "veo", "lyria", "robotics",
        "transcribe", "embedding", "translate", "imagen")

for m in client.models.list():
    name = m.name.lower()
    actions = m.supported_actions or []
    if "generateContent" in actions and "gemini" in name and not any(s in name for s in SKIP):
        print(m.name)