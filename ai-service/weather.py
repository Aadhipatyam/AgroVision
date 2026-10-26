"""Live weather for the assistant, from Open-Meteo (free, no API key)."""
import time

import httpx

GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_SECONDS = 30 * 60

# Used when the district can't be found
STATE_CAPITALS = {
    "andhra pradesh": "Vijayawada", "arunachal pradesh": "Itanagar", "assam": "Guwahati",
    "bihar": "Patna", "chhattisgarh": "Raipur", "goa": "Panaji", "gujarat": "Gandhinagar",
    "haryana": "Karnal", "himachal pradesh": "Shimla", "jharkhand": "Ranchi",
    "karnataka": "Bengaluru", "kerala": "Thiruvananthapuram", "madhya pradesh": "Bhopal",
    "maharashtra": "Mumbai", "manipur": "Imphal", "meghalaya": "Shillong", "mizoram": "Aizawl",
    "nagaland": "Kohima", "odisha": "Bhubaneswar", "punjab": "Ludhiana", "rajasthan": "Jaipur",
    "sikkim": "Gangtok", "tamil nadu": "Chennai", "telangana": "Hyderabad", "tripura": "Agartala",
    "uttar pradesh": "Lucknow", "uttarakhand": "Dehradun", "west bengal": "Kolkata",
    "delhi": "New Delhi", "jammu and kashmir": "Srinagar", "ladakh": "Leh",
}

DISTRICT_ALIASES = {
    "allahabad": "Prayagraj", "bangalore": "Bengaluru", "gurgaon": "Gurugram",
    "mysore": "Mysuru", "belgaum": "Belagavi", "gulbarga": "Kalaburagi",
    "bellary": "Ballari", "bijapur": "Vijayapura", "shimoga": "Shivamogga",
    "hubli": "Hubballi", "mangalore": "Mangaluru", "bardhaman": "Barddhaman",
}

_cache: dict = {}


def _clean(s: str) -> str:
    return " ".join(s.replace("-", " ").replace("&", "and").split()).lower()


def _geocode(client: httpx.Client, name: str, state: str):
    r = client.get(GEO_URL, params={"name": name, "count": 10, "language": "en", "format": "json"})
    r.raise_for_status()
    results = [x for x in r.json().get("results", []) if x.get("country_code") == "IN"]
    s = _clean(state)
    for x in results:
        a = _clean(x.get("admin1", ""))
        if a and (s in a or a in s):
            return x
    return None


def _find_place(client: httpx.Client, district: str, state: str):
    place = None
    if district:
        place = _geocode(client, district, state)
        alias = DISTRICT_ALIASES.get(_clean(district))
        if not place and alias:
            place = _geocode(client, alias, state)
    if not place:
        capital = STATE_CAPITALS.get(_clean(state))
        if capital:
            place = _geocode(client, capital, state)
    return place


def _condition(code) -> str:
    code = code if isinstance(code, int) else 3
    if code == 0:
        return "clear sky"
    if code in (1, 2):
        return "partly cloudy"
    if code == 3:
        return "overcast"
    if code in (45, 48):
        return "fog"
    if 51 <= code <= 57:
        return "drizzle"
    if 61 <= code <= 67 or 80 <= code <= 82:
        return "rain"
    if 71 <= code <= 77 or code in (85, 86):
        return "snow"
    if code >= 95:
        return "thunderstorm"
    return "cloudy"


def get_weather(region: str):
    """region looks like 'District, State'. Returns {'place': ..., 'text': ...} or None."""
    parts = [p.strip() for p in (region or "").split(",") if p.strip()]
    if not parts:
        return None
    state = parts[-1]
    district = parts[0] if len(parts) > 1 else ""

    key = _clean(region)
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < CACHE_SECONDS:
        return hit[1]

    try:
        with httpx.Client(timeout=8) as client:
            place = _find_place(client, district, state)
            if not place:
                return None
            r = client.get(FORECAST_URL, params={
                "latitude": place["latitude"],
                "longitude": place["longitude"],
                "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,"
                         "precipitation_sum,precipitation_probability_max",
                "timezone": "Asia/Kolkata",
                "forecast_days": 4,
            })
            r.raise_for_status()
            d = r.json()
    except Exception as e:
        print("Weather error:", e)
        return None

    cur, daily = d["current"], d["daily"]
    lines = [
        f"Now: {cur['temperature_2m']}°C, humidity {cur['relative_humidity_2m']}%, "
        f"wind {cur['wind_speed_10m']} km/h, {_condition(cur['weather_code'])}."
    ]
    for i, day in enumerate(daily["time"]):
        label = "Today" if i == 0 else "Tomorrow" if i == 1 else day
        lines.append(
            f"{label}: {_condition(daily['weather_code'][i])}, "
            f"{round(daily['temperature_2m_min'][i])} to {round(daily['temperature_2m_max'][i])}°C, "
            f"rain chance {daily['precipitation_probability_max'][i] or 0}%, "
            f"expected rain {daily['precipitation_sum'][i] or 0} mm."
        )

    result = {
        "place": f"{place['name']}, {place.get('admin1', state)}",
        "text": "\n".join(lines),
    }
    _cache[key] = (time.time(), result)
    return result