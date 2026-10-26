from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", timeout=40, max_retries=1)
search_llm = llm.bind_tools([{"google_search": {}}])

r = search_llm.invoke(
    "How to control aphids on mustard crop in West Bengal? Answer in 3 lines."
)

print("ANSWER:", r.content)
print()
print("METADATA KEYS:", list(r.response_metadata.keys()))
print()
print("GROUNDING:", r.response_metadata.get("grounding_metadata"))