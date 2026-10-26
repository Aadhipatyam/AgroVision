import time
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
]

for name in MODELS:
    llm = ChatGoogleGenerativeAI(model=name, timeout=30, max_retries=0)
    start = time.time()
    try:
        llm.invoke("Name 3 kharif crops of West Bengal in one line.")
        print(f"{name:28} {time.time() - start:5.1f}s  OK")
    except Exception as e:
        print(f"{name:28} {time.time() - start:5.1f}s  FAILED: {str(e)[:70]}")