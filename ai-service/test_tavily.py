import os
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()
client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

QUESTION = "How to control aphids on mustard crop in West Bengal"

TRUSTED = [
    "icar.gov.in", "icar.org.in", "vikaspedia.in", "farmer.gov.in",
    "agricoop.gov.in", "agriwelfare.gov.in", "nic.in",
]


def show(title, resp):
    print(f"\n=== {title} ===")
    for r in resp.get("results", []):
        print("-", r["url"])
        print("   ", r["content"][:150].replace("\n", " "))


# 1. restricted to trusted sites
try:
    show("TRUSTED SITES ONLY", client.search(
        QUESTION, search_depth="basic", max_results=5, include_domains=TRUSTED))
except Exception as e:
    print("Trusted search failed:", e)

# 2. unrestricted, for comparison
try:
    show("ANY SITE", client.search(QUESTION, search_depth="basic", max_results=5))
except Exception as e:
    print("Open search failed:", e)