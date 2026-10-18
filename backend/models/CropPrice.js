const mongoose = require('mongoose');

const cropPriceSchema = new mongoose.Schema({
  crop: {
    name: { type: String, required: true },
    variety: { type: String },
    category: { 
      type: String, 
      enum: ['cereals', 'pulses', 'oilseeds', 'vegetables', 'fruits', 'spices', 'cash_crops'],
      required: true 
    }
  },
  market: {
    state: { type: String, required: true },
    district: { type: String, required: true },
    marketName: { type: String, required: true },
    marketCode: { type: String }
  },
  pricing: {
    current: { type: Number, required: true }, // Current price per quintal
    previous: { type: Number }, // Previous day/week price
    minimum: { type: Number, required: true },
    maximum: { type: Number, required: true },
    modal: { type: Number, required: true }, // Most common price
    msp: { type: Number }, // Minimum Support Price
    unit: { type: String, default: 'quintal' }
  },
  prediction: {
    nextWeek: { type: Number },
    nextMonth: { type: Number },
    confidence: { type: Number, min: 0, max: 100 },
    trend: { 
      type: String, 
      enum: ['increasing', 'decreasing', 'stable'],
      required: true 
    },
    factors: [String] // Factors affecting price prediction
  },
  marketInsights: {
    demand: { 
      type: String, 
      enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
      required: true 
    },
    supply: { 
      type: String, 
      enum: ['very_low', 'low', 'moderate', 'high', 'very_high'],
      required: true 
    },
    quality: { 
      type: String, 
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: 'good' 
    },
    arrivals: { type: Number }, // Quantity arrived in market (quintals)
    tradedQuantity: { type: Number }
  },
  historicalData: [{
    date: { type: Date, required: true },
    price: { type: Number, required: true },
    volume: { type: Number }
  }],
  dataSource: {
    provider: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now },
    reliability: { type: Number, min: 0, max: 100, default: 85 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
cropPriceSchema.index({ 
  'crop.name': 1, 
  'market.state': 1, 
  'market.district': 1,
  'createdAt': -1 
});

cropPriceSchema.index({ 'crop.category': 1 });
cropPriceSchema.index({ 'pricing.current': 1 });

module.exports = mongoose.model('CropPrice', cropPriceSchema);