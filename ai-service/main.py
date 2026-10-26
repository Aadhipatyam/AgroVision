import os
import re
import secrets
import time
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from tavily import TavilyClient

load_dotenv()
from rag import retrieve
from weather import get_weather

app = FastAPI()

PRIMARY_MODEL = "gemini-3.5-flash-lite"
BACKUP_MODEL = "gemini-3.6-flash"

primary = ChatGoogleGenerativeAI(model=PRIMARY_MODEL, timeout=15, max_retries=1)
backup = ChatGoogleGenerativeAI(model=BACKUP_MODEL, timeout=15, max_retries=1)
llm = primary.with_fallbacks([backup])

TAVILY_KEY = os.environ.get("TAVILY_API_KEY")
tavily = TavilyClient(api_key=TAVILY_KEY) if TAVILY_KEY else None

# Shared secret: only the Node backend knows it, so only Node can use this service
SERVICE_SECRET = os.environ.get("AI_SERVICE_SECRET", "")
if not SERVICE_SECRET:
    print("WARNING: AI_SERVICE_SECRET is not set, so this service accepts any caller.")

# Web answers (for farming questions only) come from these sites.
TRUSTED_DOMAINS = [
    "icar.gov.in", "icar.org.in", "vikaspedia.in", "farmer.gov.in",
    "agricoop.gov.in", "agriwelfare.gov.in", "nic.in",
]

PORTALS = [
    {"title": "PM-KISAN official portal", "url": "https://pmkisan.gov.in"},
    {"title": "PMFBY crop insurance portal", "url": "https://pmfby.gov.in"},
]

SCHEME_GAP_ANSWER = (
    "I couldn't find this in the official scheme documents I have, so I won't "
    "guess. Please check the official portal below, or ask at your nearest "
    "Common Service Centre (CSC) or block agriculture office."
)

NO_WEATHER_ANSWER = (
    "I couldn't get live weather for your area right now. Please check the "
    "Weather page, or try again in a moment."
)

SYSTEM_PROMPT = """You are an agriculture assistant for Indian farmers.
Use simple, practical language and keep answers under 150 words.

You are given three kinds of context:
- CROP CONTEXT: verified farming documents.
- SCHEME CONTEXT: official government scheme documents.
- WEATHER DATA: live weather for the farmer's area, or "not available".

Begin your reply with exactly one of these tags:

[SCHEME] The question is about a government scheme, subsidy, insurance, loan,
  pension, payment or eligibility AND the SCHEME CONTEXT directly answers it.
  Use ONLY the SCHEME CONTEXT. Do not add any amount, date or rule that is not
  in it. End by saying rules can change and should be confirmed on the
  official portal.
[SCHEMEGAP] The question is about a government scheme, subsidy, insurance,
  loan, pension, payment or eligibility, but the SCHEME CONTEXT does not
  answer it. Write only this tag and nothing else. Never answer scheme
  questions from memory.
[WEATHER] The answer depends on current or upcoming weather (rain, heat, wind,
  irrigation, spraying, field work) AND WEATHER DATA is provided. Take every
  weather fact from WEATHER DATA only, then give simple, practical advice.
  You may use CROP CONTEXT for crop details. Do not give pesticide or
  fertiliser doses.
[NOWEATHER] The answer needs live weather but WEATHER DATA says "not
  available". Write only this tag and nothing else.
[VERIFIED] The question is about farming practices AND the CROP CONTEXT
  directly answers it. Base the answer on it. Never use this tag for
  greetings, small talk, or when the context is merely related.
[GENERAL] The question is about farming but none of the context answers it.
  Answer from general agricultural knowledge. Do not mention the context.
  Do not state exact fertiliser doses, prices, dates or subsidy amounts.
  Suggest confirming with the local Krishi Vigyan Kendra (KVK).
[OFFTOPIC] The question is not about farming. Reply in one friendly sentence
  that you help with crops, soil, pests, weather and government schemes."""

WEB_PROMPT = """You are an agriculture assistant for Indian farmers.
Write a short answer (under 150 words) in simple language, using ONLY the web
excerpts below, which come from ICAR and government sites.
- If the excerpts do not answer the question, reply with exactly: [NOANSWER]
- Use plain text only. No asterisks, no markdown, no bold or italics.
- Give cultural, biological and low-risk methods first.
- Do not name specific pesticides and do not give any doses. If chemical
  control may be needed, say the farmer should ask the local Krishi Vigyan
  Kendra (KVK) or agriculture officer for a registered product and follow the
  label.
- Do not mention "excerpts" or "search"."""

GREETING = re.compile(
    r"^\s*(hi|hii+|hello|hey|namaste|namaskar|नमस्ते|नमस्कार|thanks|thank you|ok|okay|bye|good (morning|afternoon|evening))\s*[!.?]*\s*$",
    re.IGNORECASE,
)

# Only used to decide whether to fetch live weather. The model still chooses the final tag.
WEATHER_HINT = re.compile(
    r"weather|rain|rainfall|barish|baarish|mausam|बारिश|मौसम|temperature|forecast|humid|wind|storm|"
    r"cyclone|flood|hail|frost|heat|cold|irrigat|spray|today|tomorrow|this week|next week|next few days",
    re.IGNORECASE,
)

TAGS = (
    ("[SCHEMEGAP]", "scheme_gap"),
    ("[SCHEME]", "scheme"),
    ("[NOWEATHER]", "no_weather"),
    ("[WEATHER]", "weather"),
    ("[VERIFIED]", "verified"),
    ("[GENERAL]", "general"),
    ("[OFFTOPIC]", "offtopic"),
)


class Ask(BaseModel):
    question: str
    region: str = ""


def to_text(content) -> str:
    if isinstance(content, str):
        return content
    return "".join(
        part.get("text", "") if isinstance(part, dict) else str(part)
        for part in content
    )


def split_tag(text: str):
    text = text.strip()
    for tag, mode in TAGS:
        if text.startswith(tag):
            return mode, text[len(tag):].strip()
    return "general", text      # model forgot the tag: treat as unverified


def log_gap(kind: str, question: str, region: str):
    """Remember questions the documents could not answer."""
    try:
        with open("gaps.log", "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M')}\t{kind}\t{region}\t{question}\n")
    except Exception:
        pass


def label(d):
    src = d.metadata.get("source_file", "unknown")
    page = d.metadata.get("page")
    return f"[{src} p.{page + 1}]" if page is not None else f"[{src}]"


def build_context(docs):
    return "\n\n".join(f"{label(d)}\n{d.page_content}" for d in docs) or "none"


def file_names(docs):
    return sorted({d.metadata.get("source_file") for d in docs if d.metadata.get("source_file")})


def web_search(question: str, region: str):
    if tavily is None:
        return []
    try:
        resp = tavily.search(
            f"{question} {region}".strip(),
            search_depth="basic",
            max_results=4,
            include_domains=TRUSTED_DOMAINS,
        )
    except Exception as e:
        print("Search error:", e)
        return []
    results = []
    for r in resp.get("results", []):
        url = r.get("url", "")
        if url.startswith("http") and r.get("content"):
            results.append({
                "title": r.get("title") or url,
                "url": url,
                "content": r["content"][:1200],
            })
    return results


def answer_from_web(question: str, region: str):
    """Returns (answer, links) or None if the web gave nothing useful."""
    results = web_search(question, region)
    if not results:
        return None
    excerpts = "\n\n".join(f"[{r['url']}]\n{r['content']}" for r in results)
    reply = llm.invoke([
        ("system", WEB_PROMPT),
        ("human", f"WEB EXCERPTS:\n{excerpts}\n\nRegion: {region or 'not given'}\n\nQuestion: {question}"),
    ])
    text = to_text(reply.content).strip()
    if not text or "[NOANSWER]" in text:
        return None
    links = [{"title": r["title"], "url": r["url"]} for r in results[:3]]
    return text, links


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ask")
def ask(body: Ask, x_service_key: Optional[str] = Header(default=None)):
    start = time.time()

    if SERVICE_SECRET and not secrets.compare_digest(x_service_key or "", SERVICE_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Greetings / small talk: no retrieval, no model call
    if GREETING.match(body.question):
        return {
            "answer": "Hello! I can help with crops, soil, pests, weather and government schemes. What would you like to know?",
            "mode": "chat",
            "sources": [],
            "links": [],
            "seconds": 0.0,
        }

    try:
        query = f"{body.question} {body.region}".strip()
        crop_docs = retrieve("crops", query, k=4)
        scheme_docs = retrieve("schemes", query, k=3)

        # Live weather, only when the question looks weather-related and we know the area
        weather = None
        if body.region and WEATHER_HINT.search(body.question):
            weather = get_weather(body.region)

        weather_text = (
            f"Place: {weather['place']}\n{weather['text']}" if weather else "not available"
        )

        reply = llm.invoke([
            ("system", SYSTEM_PROMPT),
            ("human",
             f"CROP CONTEXT:\n{build_context(crop_docs)}\n\n"
             f"SCHEME CONTEXT:\n{build_context(scheme_docs)}\n\n"
             f"WEATHER DATA:\n{weather_text}\n\n"
             f"Region: {body.region or 'not given'}\n\nQuestion: {body.question}"),
        ])

        mode, answer = split_tag(to_text(reply.content))
        sources, links = [], []

        # The model may only use the weather tag when weather data was really supplied
        if mode == "weather" and not weather:
            mode = "general"

        if mode == "verified":
            sources = file_names(crop_docs)

        elif mode == "weather":
            sources = [f"Live weather for {weather['place']} (Open-Meteo)"]

        elif mode == "no_weather":
            answer = NO_WEATHER_ANSWER
            mode = "chat"

        elif mode == "scheme":
            sources = file_names(scheme_docs)
            links = PORTALS

        elif mode == "scheme_gap":
            log_gap("scheme", body.question, body.region)
            answer = SCHEME_GAP_ANSWER      # fixed text: never a guessed answer
            links = PORTALS

        elif mode == "general":
            log_gap("crop", body.question, body.region)
            try:
                web = answer_from_web(body.question, body.region)
            except Exception as e:
                print("Web answer error:", e)
                web = None
            if web:
                answer, links = web
                mode = "web"

        return {
            "answer": answer,
            "mode": mode,
            "sources": sources,
            "links": links,
            "seconds": round(time.time() - start, 1),
        }
    except Exception as e:
        print("AI error:", e)
        raise HTTPException(status_code=503, detail="The AI model is busy. Please try again shortly.")