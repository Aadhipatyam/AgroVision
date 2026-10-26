from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()


def try_call(label, llm, prompt):
    try:
        llm.invoke(prompt)
        print(f"OK      {label}")
    except Exception as e:
        print(f"FAILED  {label}: {str(e)[:100]}")


for name in ["gemini-3.5-flash-lite", "gemini-3.6-flash"]:
    base = ChatGoogleGenerativeAI(model=name, timeout=30, max_retries=0)
    try_call(f"{name} plain", base, "Say hi")
    try_call(
        f"{name} + google_search",
        base.bind_tools([{"google_search": {}}]),
        "Who is the current Prime Minister of India?",
    )