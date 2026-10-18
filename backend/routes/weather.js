// routes/weather.js
const express = require('express');
const axios = require('axios');
const WeatherData = require('../models/WeatherData');
const auth = require('../middleware/auth');

const router = express.Router();

const CACHE_MS = 30 * 60 * 1000; // 30 minutes
const OWM_KEY = process.env.OPENWEATHER_API_KEY;
const OWM_BASE = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';

// Get current weather + forecast for a location
router.get('/:state/:district?', auth, async (req, res) => {
  try {
    const { state, district } = req.params;

    // Serve from cache if recent
    const cached = await WeatherData.findOne({
      'location.state': state,
      ...(district ? { 'location.district': district } : {})
    }).sort({ 'dataSource.lastUpdated': -1 });

    if (cached && Date.now() - new Date(cached.dataSource.lastUpdated).getTime() < CACHE_MS) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const weather = OWM_KEY
      ? await fetchLiveWeather(state, district)
      : generateMockWeather(state, district);

    const saved = await WeatherData.findOneAndUpdate(
      { 'location.state': state, 'location.district': district || 'Central' },
      weather,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: saved, cached: false });

  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch weather data' });
  }
});

// Get agricultural advisories only (irrigation/pest/sowing alerts)
router.get('/:state/:district/advisory', auth, async (req, res) => {
  try {
    const { state, district } = req.params;

    const weather = await WeatherData.findOne({
      'location.state': state,
      'location.district': district
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

async function fetchLiveWeather(state, district) {
  const query = `${district ? district + ',' : ''}${state},IN`;

  const geo = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
    params: { q: query, limit: 1, appid: OWM_KEY }
  });

  if (!geo.data.length) {
    // Location not found upstream — fall back to mock rather than failing the request
    return generateMockWeather(state, district);
  }

  const { lat, lon } = geo.data[0];

  const [current, forecast] = await Promise.all([
    axios.get(`${OWM_BASE}/weather`, { params: { lat, lon, appid: OWM_KEY, units: 'metric' } }),
    axios.get(`${OWM_BASE}/forecast`, { params: { lat, lon, appid: OWM_KEY, units: 'metric' } })
  ]);

  const c = current.data;
  const dailyForecast = extractDailyForecast(forecast.data.list);

  return {
    location: {
      state,
      district: district || 'Central',
      coordinates: { latitude: lat, longitude: lon }
    },
    current: {
      temperature: c.main.temp,
      humidity: c.main.humidity,
      pressure: c.main.pressure,
      windSpeed: c.wind.speed,
      windDirection: degreesToCompass(c.wind.deg),
      visibility: c.visibility,
      uvIndex: 0, // requires a separate One Call subscription; left as 0 rather than faked
      condition: c.weather[0].main,
      icon: c.weather[0].icon
    },
    forecast: dailyForecast,
    agriculturalAdvisory: buildAdvisory(c, dailyForecast),
    dataSource: {
      provider: 'OpenWeatherMap',
      lastUpdated: new Date(),
      accuracy: 90
    }
  };
}

function extractDailyForecast(list) {
  // OpenWeather's free /forecast endpoint returns 3-hour steps; collapse to daily highs/lows
  const byDate = {};
  for (const entry of list) {
    const date = entry.dt_txt.split(' ')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(entry);
  }

  return Object.entries(byDate).slice(0, 5).map(([date, entries]) => {
    const temps = entries.map(e => e.main.temp);
    const midday = entries.find(e => e.dt_txt.includes('12:00:00')) || entries[0];
    return {
      date: new Date(date),
      high: Math.max(...temps),
      low: Math.min(...temps),
      condition: midday.weather[0].main,
      icon: midday.weather[0].icon,
      humidity: midday.main.humidity,
      windSpeed: midday.wind.speed,
      precipitation: midday.rain ? midday.rain['3h'] || 0 : 0,
      precipitationProbability: Math.round((midday.pop || 0) * 100)
    };
  });
}

function buildAdvisory(current, forecast) {
  const advisory = [];

  if (current.main.humidity > 85 && current.weather[0].main.toLowerCase().includes('rain')) {
    advisory.push({
      type: 'pest',
      priority: 'high',
      title: 'High humidity, pest risk',
      description: 'High humidity and rain increase fungal and pest pressure. Inspect crops closely over the next few days.',
      validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });
  }

  const rainySoon = forecast.some(f => f.precipitationProbability > 60);
  if (rainySoon) {
    advisory.push({
      type: 'irrigation',
      priority: 'medium',
      title: 'Rain expected',
      description: 'Rain is likely in the coming days — consider delaying scheduled irrigation.',
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });
  }

  return advisory;
}

function degreesToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// Mock fallback used only when OPENWEATHER_API_KEY isn't configured or the
// upstream lookup fails — kept for local development without API keys.
function generateMockWeather(state, district) {
  const temp = Math.round(20 + Math.random() * 15);
  const forecast = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      date,
      high: temp + Math.round(Math.random() * 4),
      low: temp - Math.round(Math.random() * 6),
      condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
      icon: '01d',
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(Math.random() * 20),
      precipitation: Math.round(Math.random() * 10),
      precipitationProbability: Math.round(Math.random() * 100)
    };
  });

  return {
    location: {
      state,
      district: district || 'Central',
      coordinates: { latitude: 0, longitude: 0 }
    },
    current: {
      temperature: temp,
      humidity: Math.round(40 + Math.random() * 40),
      pressure: 1013,
      windSpeed: Math.round(Math.random() * 20),
      windDirection: 'NE',
      visibility: 10000,
      uvIndex: Math.round(Math.random() * 10),
      condition: 'Clear',
      icon: '01d'
    },
    forecast,
    agriculturalAdvisory: [],
    dataSource: {
      provider: 'Mock (no OPENWEATHER_API_KEY configured)',
      lastUpdated: new Date(),
      accuracy: 50
    }
  };
}

module.exports = router;
