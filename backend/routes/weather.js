// routes/weather.js
const express = require('express');
const axios = require('axios');
const WeatherData = require('../models/WeatherData');
const auth = require('../middleware/auth');

const router = express.Router();

const CACHE_MS = 30 * 60 * 1000; // 30 minutes
const PROVIDER = 'Open-Meteo';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const http = axios.create({ timeout: 12000 });

// Used when a district can't be found, or when only a state is given
const STATE_CAPITALS = {
  'andhra pradesh': 'Vijayawada',
  'arunachal pradesh': 'Itanagar',
  assam: 'Guwahati',
  bihar: 'Patna',
  chhattisgarh: 'Raipur',
  goa: 'Panaji',
  gujarat: 'Gandhinagar',
  haryana: 'Karnal',
  'himachal pradesh': 'Shimla',
  jharkhand: 'Ranchi',
  karnataka: 'Bengaluru',
  kerala: 'Thiruvananthapuram',
  'madhya pradesh': 'Bhopal',
  maharashtra: 'Mumbai',
  manipur: 'Imphal',
  meghalaya: 'Shillong',
  mizoram: 'Aizawl',
  nagaland: 'Kohima',
  odisha: 'Bhubaneswar',
  punjab: 'Ludhiana',
  rajasthan: 'Jaipur',
  sikkim: 'Gangtok',
  'tamil nadu': 'Chennai',
  telangana: 'Hyderabad',
  tripura: 'Agartala',
  'uttar pradesh': 'Lucknow',
  uttarakhand: 'Dehradun',
  'west bengal': 'Kolkata',
  delhi: 'New Delhi',
  'jammu and kashmir': 'Srinagar',
  ladakh: 'Leh',
};

// Old or alternate district names the geocoder may not know
const DISTRICT_ALIASES = {
  allahabad: 'Prayagraj',
  bangalore: 'Bengaluru',
  gurgaon: 'Gurugram',
  mysore: 'Mysuru',
  belgaum: 'Belagavi',
  gulbarga: 'Kalaburagi',
  bellary: 'Ballari',
  bijapur: 'Vijayapura',
  shimoga: 'Shivamogga',
  hubli: 'Hubballi',
  mangalore: 'Mangaluru',
  bardhaman: 'Barddhaman',
  karimganj: 'Sribhumi',
};

// Remembers which place a location resolved to. Display only, never saved in MongoDB.
const placeCache = new Map();
const placeKey = (state, district) => `${state}|${district}`;

// --- Name helpers (frontend may send "west-bengal" or "West Bengal") ---

function cleanName(s) {
  return decodeURIComponent(String(s || ''))
    .replace(/-/g, ' ')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATE_ALIASES = { 'jammu kashmir': 'jammu and kashmir' };

function normalizeState(raw) {
  const key = cleanName(raw);
  return titleCase(STATE_ALIASES[key] || key);
}

function normalizeDistrict(raw) {
  return raw ? titleCase(cleanName(raw)) : 'Central';
}

// --- Routes ---

// Current weather + 7-day forecast for a location
router.get('/:state/:district?', auth, async (req, res) => {
  try {
    const state = normalizeState(req.params.state);
    const district = normalizeDistrict(req.params.district);
    const filter = { 'location.state': state, 'location.district': district };
    const key = placeKey(state, district);

    const cached = await WeatherData.findOne({ ...filter, 'dataSource.provider': PROVIDER })
      .sort({ 'dataSource.lastUpdated': -1 });

    if (cached && Date.now() - new Date(cached.dataSource.lastUpdated).getTime() < CACHE_MS) {
      return res.json({ success: true, data: cached, place: placeCache.get(key) || null, cached: true });
    }

    let result;
    try {
      result = await fetchLiveWeather(state, district);
    } catch (err) {
      console.error('Open-Meteo error:', err.message);
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          place: placeCache.get(key) || null,
          cached: true,
          stale: true,
        });
      }
      return res.status(502).json({ success: false, message: 'Weather service is unavailable right now' });
    }

    if (!result) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    placeCache.set(key, result.place);

    // Saving is only a cache. If it fails, the farmer still gets the live data.
    let saved;
    try {
      saved = await WeatherData.findOneAndUpdate(filter, result.weather, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
    } catch (err) {
      console.error('Could not cache weather:', err.message);
      saved = result.weather;
    }

    res.json({ success: true, data: saved, place: result.place, cached: false });
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch weather data' });
  }
});

// Agricultural advisories only (irrigation/pest alerts)
router.get('/:state/:district/advisory', auth, async (req, res) => {
  try {
    const state = normalizeState(req.params.state);
    const district = normalizeDistrict(req.params.district);

    const weather = await WeatherData.findOne({
      'location.state': state,
      'location.district': district,
    }).sort({ 'dataSource.lastUpdated': -1 });

    if (!weather) {
      return res.status(404).json({ success: false, message: 'No weather data found for this location yet' });
    }

    res.json({ success: true, data: weather.agriculturalAdvisory });
  } catch (error) {
    console.error('Advisory fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agricultural advisory' });
  }
});

// --- Helpers ---

async function geocode(name, state) {
  const { data } = await http.get(GEO_URL, {
    params: { name, count: 10, language: 'en', format: 'json' },
  });
  const results = (data.results || []).filter((r) => r.country_code === 'IN');
  if (!results.length) return null;

  const s = cleanName(state);
  return (
    results.find((r) => {
      const a = cleanName(r.admin1 || '');
      return a && (a.includes(s) || s.includes(a));
    }) || null
  );
}

async function findPlace(state, district) {
  if (district !== 'Central') {
    let place = await geocode(district, state);
    const alias = DISTRICT_ALIASES[cleanName(district)];
    if (!place && alias) place = await geocode(alias, state);
    if (place) return place;
    console.warn(`District "${district}" not found in ${state}; using the state's main city instead`);
  }
  const capital = STATE_CAPITALS[cleanName(state)];
  if (capital) {
    const place = await geocode(capital, state);
    if (place) return place;
  }
  return geocode(state, state);
}

async function fetchLiveWeather(state, district) {
  const place = await findPlace(state, district);
  if (!place) return null;

  const { data } = await http.get(FORECAST_URL, {
    params: {
      latitude: place.latitude,
      longitude: place.longitude,
      current: 'temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m,weather_code',
      hourly: 'relative_humidity_2m,visibility',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,' +
        'precipitation_probability_max,wind_speed_10m_max,uv_index_max',
      timezone: 'Asia/Kolkata',
      forecast_days: 7,
    },
  });

  const c = data.current;
  const hourIndex = (prefix) => data.hourly.time.findIndex((t) => t.startsWith(prefix));

  const nowIdx = hourIndex(c.time.slice(0, 13));
  const nowCond = wmo(c.weather_code);

  const current = {
    temperature: c.temperature_2m,
    humidity: c.relative_humidity_2m,
    pressure: Math.round(c.pressure_msl),
    windSpeed: c.wind_speed_10m, // km/h
    windDirection: degreesToCompass(c.wind_direction_10m),
    visibility:
      nowIdx >= 0 && data.hourly.visibility[nowIdx] != null ? data.hourly.visibility[nowIdx] : 10000, // metres
    uvIndex: Math.round(data.daily.uv_index_max[0] || 0),
    condition: nowCond.condition,
    icon: nowCond.icon,
  };

  const forecast = data.daily.time.map((date, i) => {
    const w = wmo(data.daily.weather_code[i]);
    const idx = hourIndex(`${date}T12`);
    return {
      date: new Date(date),
      high: data.daily.temperature_2m_max[i],
      low: data.daily.temperature_2m_min[i],
      condition: w.condition,
      icon: w.icon,
      humidity: idx >= 0 ? data.hourly.relative_humidity_2m[idx] : current.humidity,
      windSpeed: data.daily.wind_speed_10m_max[i],
      precipitation: data.daily.precipitation_sum[i] || 0,
      precipitationProbability: data.daily.precipitation_probability_max[i] || 0,
    };
  });

  return {
    // Shown on the page, but NOT saved: the WeatherData collection has a geo index on
    // location.coordinates, which reads {latitude, longitude} in the wrong order and
    // rejects any place east of 90 degrees longitude (Tripura, Assam, Meghalaya...).
    place: {
      name: place.name,
      region: place.admin1 || '',
      latitude: place.latitude,
      longitude: place.longitude,
    },
    weather: {
      location: { state, district },
      current,
      forecast,
      agriculturalAdvisory: buildAdvisory(current, forecast),
      dataSource: {
        provider: PROVIDER,
        lastUpdated: new Date(),
        accuracy: 90,
      },
    },
  };
}

// WMO weather codes -> simple condition names
function wmo(code) {
  if (code === 0) return { condition: 'Clear', icon: '01d' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: '02d' };
  if (code === 3) return { condition: 'Clouds', icon: '04d' };
  if (code === 45 || code === 48) return { condition: 'Fog', icon: '50d' };
  if (code >= 51 && code <= 57) return { condition: 'Drizzle', icon: '09d' };
  if (code >= 61 && code <= 67) return { condition: 'Rain', icon: '10d' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: '13d' };
  if (code >= 80 && code <= 82) return { condition: 'Rain', icon: '09d' };
  if (code === 85 || code === 86) return { condition: 'Snow', icon: '13d' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: '11d' };
  return { condition: 'Clouds', icon: '03d' };
}

// Simple rules based on the forecast. No doses or product advice.
function buildAdvisory(current, forecast) {
  const advisory = [];
  const DAY = 24 * 60 * 60 * 1000;
  const next3 = forecast.slice(0, 3);

  if (current.humidity > 85 && /rain|drizzle|thunder/i.test(current.condition)) {
    advisory.push({
      type: 'pest',
      priority: 'high',
      title: 'High humidity, pest risk',
      description:
        'High humidity and rain increase fungal and pest pressure. Inspect crops closely over the next few days.',
      validUntil: new Date(Date.now() + 3 * DAY),
    });
  }

  if (next3.some((f) => f.precipitationProbability > 60 || f.precipitation > 10)) {
    advisory.push({
      type: 'irrigation',
      priority: 'medium',
      title: 'Rain expected',
      description: 'Rain is likely in the next few days. Consider delaying scheduled irrigation.',
      validUntil: new Date(Date.now() + 3 * DAY),
    });
  }

  if (next3.some((f) => f.high >= 38)) {
    advisory.push({
      type: 'irrigation',
      priority: 'medium',
      title: 'Hot spell',
      description:
        'Very high temperatures are forecast. Irrigate in the early morning or evening and avoid spraying in the midday heat.',
      validUntil: new Date(Date.now() + 3 * DAY),
    });
  }

  return advisory;
}

function degreesToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((deg || 0) / 45) % 8];
}

module.exports = router;