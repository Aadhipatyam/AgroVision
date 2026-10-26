import httpx
from bs4 import BeautifulSoup

URLS = [
    "https://en.vikaspedia.in/agriculture/crop-production/tips-for-farmers/icar-agri-advisory-for-rabi-2021-22/icar-rabi-season-agro-advisory-for-west-bengal",
    "https://en.vikaspedia.in/viewcontent/agriculture/best-practices/sustainable-agriculture/crop-management/sri-2013-new-method-of-growing-rice",
    "https://en.vikaspedia.in/agriculture/crop-production/tips-for-farmers/icar-agro-advisory-for-kharif",
]

for url in URLS:
    try:
        r = httpx.get(url, timeout=30, follow_redirects=True,
                      headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(r.text, "lxml")
        for t in soup(["script", "style"]):
            t.decompose()
        print(f"{r.status_code}  {len(soup.get_text()):>7} chars  ...{url[-55:]}")
    except Exception as e:
        print(f"FAILED  ...{url[-55:]}\n    {type(e).__name__}: {e}")