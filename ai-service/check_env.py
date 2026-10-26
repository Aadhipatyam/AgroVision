import os
from dotenv import load_dotenv

load_dotenv(override=True)

for name in ["GOOGLE_API_KEY", "TAVILY_API_KEY"]:
    v = os.environ.get(name)
    if v is None:
        print(f"{name}: NOT FOUND")
        continue
    print(
        f"{name}: length={len(v)}, starts_with={v[:5]!r}, "
        f"has_spaces={v != v.strip() or ' ' in v}, "
        f"has_quotes={'\"' in v or chr(39) in v}, "
        f"is_placeholder={'xxxx' in v.lower() or 'paste' in v.lower()}"
    )