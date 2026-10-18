const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  location: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    }
  },
  current: {
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    pressure: { type: Number, required: true },
    windSpeed: { type: Number, required: true },
    windDirection: { type: String, required: true },
    visibility: { type: Number, required: true },
    uvIndex: { type: Number, required: true },
    condition: { type: String, required: true },
    icon: { type: String, required: true }
  },
  forecast: [{
    date: { type: Date, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    condition: { type: String, required: true },
    icon: { type: String, required: true },
    humidity: { type: Number, required: true },
    windSpeed: { type: Number, required: true },
    precipitation: { type: Number, default: 0 },
    precipitationProbability: { type: Number, default: 0 }
  }],
  agriculturalAdvisory: [{
    type: { 
      type: String, 
      enum: ['irrigation', 'pest', 'harvesting', 'sowing', 'fertilizer'],
      required: true 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    validUntil: { type: Date, required: true }
  }],
  satelliteData: {
    ndvi: { type: Number }, // Normalized Difference Vegetation Index
    soilMoisture: { type: Number },
    landSurfaceTemperature: { type: Number },
    precipitationEstimate: { type: Number }
  },
  dataSource: {
    provider: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now },
    accuracy: { type: Number, min: 0, max: 100 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient location-based queries
weatherDataSchema.index({ 
  'location.state': 1, 
  'location.district': 1, 
  'createdAt': -1 
});

// Index for coordinate-based queries
weatherDataSchema.index({ 
  'location.coordinates': '2dsphere' 
});

module.exports = mongoose.model('WeatherData', weatherDataSchema);