const mongoose = require('mongoose');
const User = require('../models/User');
const Policy = require('../models/Policy');
const CropPrice = require('../models/CropPrice');
const WeatherData = require('../models/WeatherData');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrovision', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Policy.deleteMany({});
    await CropPrice.deleteMany({});
    await WeatherData.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Seed Policies
    await seedPolicies();
    console.log('✅ Policies seeded');

    // Seed Crop Prices
    await seedCropPrices();
    console.log('✅ Crop prices seeded');

    // Seed Weather Data
    await seedWeatherData();
    console.log('✅ Weather data seeded');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

async function seedPolicies() {
  const policies = [
    {
      title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      description: 'Comprehensive crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities, pests & diseases.',
      category: 'insurance',
      level: 'central',
      applicableStates: [],
      eligibility: {
        criteria: ['All farmers growing notified crops', 'Sharecroppers and tenant farmers eligible'],
        farmSize: { min: 0, max: 1000, unit: 'acres' },
        cropTypes: ['wheat', 'rice', 'cotton', 'sugarcane', 'oilseeds', 'pulses'],
        farmerCategory: ['small', 'marginal', 'large']
      },
      benefits: {
        financial: { amount: 200000, type: 'percentage', maxAmount: 200000 },
        description: 'Coverage up to 100% of sum insured for crop losses'
      },
      applicationProcess: {
        steps: [
          'Visit nearest bank or CSC center',
          'Fill application form with required documents',
          'Pay premium amount (2% for Kharif, 1.5% for Rabi)',
          'Receive policy document and coverage details'
        ],
        documents: ['Aadhaar Card', 'Bank Account Details', 'Land Records', 'Sowing Certificate'],
        onlinePortal: 'https://pmfby.gov.in',
        processingTime: '15-30 days'
      },
      timeline: { isOngoing: true, applicationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
      contactInfo: {
        department: 'Department of Agriculture & Cooperation',
        phone: '1800-180-1551',
        email: 'pmfby-dac@gov.in',
        website: 'https://pmfby.gov.in'
      },
      priority: 'high',
      status: 'active',
      tags: ['crop insurance', 'financial support', 'risk management']
    },
    {
      title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      description: 'Direct income support scheme providing ₹6,000 per year to eligible farmer families in three equal installments of ₹2,000 each.',
      category: 'subsidy',
      level: 'central',
      applicableStates: [],
      eligibility: {
        criteria: ['Small and marginal farmers', 'Landholding farmers', 'Cultivable land holders'],
        farmSize: { min: 0, max: 5, unit: 'acres' },
        farmerCategory: ['small', 'marginal']
      },
      benefits: {
        financial: { amount: 6000, type: 'lump_sum' },
        description: '₹2,000 per installment, three times a year (April-July, August-November, December-March)'
      },
      applicationProcess: {
        steps: [
          'Register on PM-KISAN portal or visit CSC',
          'Provide Aadhaar and bank account details',
          'Submit land ownership documents',
          'Village level verification by local officials',
          'Approval and direct benefit transfer'
        ],
        documents: ['Aadhaar Card', 'Bank Account Details', 'Land Ownership Documents', 'Citizenship Certificate'],
        onlinePortal: 'https://pmkisan.gov.in',
        processingTime: '30-45 days'
      },
      timeline: { isOngoing: true },
      contactInfo: {
        department: 'Department of Agriculture & Farmers Welfare',
        phone: '155261',
        email: 'pmkisan-ict@gov.in',
        website: 'https://pmkisan.gov.in'
      },
      priority: 'high',
      status: 'active',
      tags: ['income support', 'direct benefit transfer', 'financial assistance']
    },
    {
      title: 'Kisan Credit Card (KCC) Scheme',
      description: 'Credit facility for farmers to meet their agricultural and allied activities including crop cultivation, post-harvest expenses, and asset maintenance.',
      category: 'credit',
      level: 'central',
      applicableStates: [],
      eligibility: {
        criteria: ['All farmers including tenant farmers', 'Self Help Group members', 'Joint Liability Group members'],
        farmSize: { min: 0, max: 1000, unit: 'acres' }
      },
      benefits: {
        financial: { amount: 300000, type: 'lump_sum', maxAmount: 300000 },
        description: 'Credit up to ₹3 lakh at 4% interest rate with flexible repayment'
      },
      applicationProcess: {
        steps: [
          'Visit nearest bank branch',
          'Fill KCC application form',
          'Submit required documents',
          'Bank verification and assessment',
          'Card issuance and credit limit sanctioning'
        ],
        documents: ['Identity Proof', 'Address Proof', 'Land Documents', 'Income Certificate'],
        processingTime: '15-30 days'
      },
      timeline: { isOngoing: true },
      contactInfo: {
        department: 'Department of Financial Services',
        phone: '1800-180-1111',
        website: 'https://kcc.gov.in'
      },
      priority: 'high',
      status: 'active',
      tags: ['credit facility', 'agricultural finance', 'low interest']
    }
  ];

  // Add state-specific policies for major agricultural states
  const states = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana'];
  
  for (const state of states) {
    policies.push({
      title: `${state} Agricultural Development Scheme`,
      description: `State-specific agricultural support and development scheme for ${state} farmers including subsidies on equipment, seeds, fertilizers, and technology adoption.`,
      category: 'subsidy',
      level: 'state',
      applicableStates: [state],
      eligibility: {
        criteria: [`${state} resident farmers`, 'Valid land ownership documents', 'Active cultivation proof'],
        farmSize: { min: 0, max: 50, unit: 'acres' }
      },
      benefits: {
        financial: { amount: 50000, type: 'lump_sum' },
        description: 'Equipment subsidies (50%), seed support, fertilizer subsidies, and training programs'
      },
      applicationProcess: {
        steps: [
          'Visit district agriculture office',
          'Submit application with required documents',
          'Field verification by agriculture officer',
          'Approval by district collector',
          'Subsidy disbursement through DBT'
        ],
        documents: ['Residence Certificate', 'Land Records', 'Aadhaar Card', 'Bank Details', 'Caste Certificate (if applicable)'],
        processingTime: '45-60 days'
      },
      timeline: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isOngoing: true
      },
      contactInfo: {
        department: `${state} Department of Agriculture`,
        phone: '1800-XXX-XXXX'
      },
      priority: 'medium',
      status: 'active',
      tags: ['state scheme', 'agricultural development', 'subsidies', 'equipment support']
    });
  }

  await Policy.insertMany(policies);
}

async function seedCropPrices() {
  const crops = ['wheat', 'rice', 'cotton', 'sugarcane', 'soybean', 'corn', 'pulses'];
  const states = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu'];
  const prices = [];

  for (const crop of crops) {
    for (const state of states) {
      const basePrice = getCropBasePrice(crop);
      const currentPrice = Math.round(basePrice + (Math.random() - 0.5) * basePrice * 0.2);
      
      prices.push({
        crop: {
          name: crop,
          category: getCropCategory(crop)
        },
        market: {
          state,
          district: `${state} Central`,
          marketName: `${state} Mandi`,
          marketCode: `${state.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 1000)}`
        },
        pricing: {
          current: currentPrice,
          previous: currentPrice + Math.round((Math.random() - 0.5) * 100),
          minimum: Math.round(currentPrice * 0.9),
          maximum: Math.round(currentPrice * 1.1),
          modal: currentPrice,
          msp: Math.round(currentPrice * 0.85),
          unit: 'quintal'
        },
        prediction: {
          nextWeek: Math.round(currentPrice + (Math.random() - 0.5) * 200),
          nextMonth: Math.round(currentPrice + (Math.random() - 0.5) * 400),
          confidence: Math.round(Math.random() * 20 + 80),
          trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)],
          factors: ['Weather conditions', 'Market demand', 'Export opportunities', 'Government policies']
        },
        marketInsights: {
          demand: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
          supply: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
          quality: 'good',
          arrivals: Math.round(Math.random() * 1000 + 500),
          tradedQuantity: Math.round(Math.random() * 800 + 400)
        },
        historicalData: generateHistoricalPriceData(currentPrice),
        dataSource: {
          provider: 'AgriMarket API',
          lastUpdated: new Date(),
          reliability: 90
        }
      });
    }
  }

  await CropPrice.insertMany(prices);
}

async function seedWeatherData() {
  const states = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu'];
  const weatherData = [];

  for (const state of states) {
    const coordinates = getStateCoordinates(state);
    
    weatherData.push({
      location: {
        state,
        district: `${state} Central`,
        coordinates
      },
      current: {
        temperature: Math.round(Math.random() * 15 + 25), // 25-40°C
        humidity: Math.round(Math.random() * 30 + 50), // 50-80%
        pressure: Math.round(Math.random() * 50 + 1000), // 1000-1050 hPa
        windSpeed: Math.round(Math.random() * 20 + 5), // 5-25 km/h
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        visibility: Math.round(Math.random() * 5 + 5), // 5-10 km
        uvIndex: Math.round(Math.random() * 8 + 2), // 2-10
        condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
        icon: 'partly-cloudy'
      },
      forecast: generateWeatherForecast(),
      agriculturalAdvisory: generateAgriculturalAdvisory(),
      satelliteData: {
        ndvi: Math.random() * 0.5 + 0.3, // 0.3-0.8
        soilMoisture: Math.random() * 40 + 20, // 20-60%
        landSurfaceTemperature: Math.random() * 10 + 30, // 30-40°C
        precipitationEstimate: Math.random() * 10 // 0-10mm
      },
      dataSource: {
        provider: 'OpenWeatherMap',
        lastUpdated: new Date(),
        accuracy: 85
      }
    });
  }

  await WeatherData.insertMany(weatherData);
}

// Helper functions
function getCropBasePrice(crop) {
  const basePrices = {
    wheat: 2500, rice: 2800, corn: 2200, cotton: 6000,
    sugarcane: 350, soybean: 4500, pulses: 5500
  };
  return basePrices[crop] || 3000;
}

function getCropCategory(crop) {
  const categories = {
    wheat: 'cereals', rice: 'cereals', corn: 'cereals',
    cotton: 'cash_crops', sugarcane: 'cash_crops',
    soybean: 'oilseeds', pulses: 'pulses'
  };
  return categories[crop] || 'cereals';
}

function generateHistoricalPriceData(currentPrice) {
  const data = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const price = Math.round(currentPrice + (Math.random() - 0.5) * 300);
    data.push({
      date,
      price,
      volume: Math.round(Math.random() * 500 + 200)
    });
  }
  return data;
}

function getStateCoordinates(state) {
  const coordinates = {
    Punjab: { latitude: 31.1471, longitude: 75.3412 },
    Haryana: { latitude: 29.0588, longitude: 76.0856 },
    'Uttar Pradesh': { latitude: 26.8467, longitude: 80.9462 },
    Maharashtra: { latitude: 19.7515, longitude: 75.7139 },
    Karnataka: { latitude: 15.3173, longitude: 75.7139 },
    'Tamil Nadu': { latitude: 11.1271, longitude: 78.6569 }
  };
  return coordinates[state] || { latitude: 20.5937, longitude: 78.9629 };
}

function generateWeatherForecast() {
  const forecast = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    forecast.push({
      date,
      high: Math.round(Math.random() * 10 + 30),
      low: Math.round(Math.random() * 10 + 20),
      condition: ['Clear', 'Partly Cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
      icon: 'partly-cloudy',
      humidity: Math.round(Math.random() * 30 + 50),
      windSpeed: Math.round(Math.random() * 15 + 5),
      precipitation: Math.random() * 20,
      precipitationProbability: Math.round(Math.random() * 100)
    });
  }
  return forecast;
}

function generateAgriculturalAdvisory() {
  return [
    {
      type: 'irrigation',
      priority: 'high',
      title: 'Irrigation Advisory',
      description: 'Heavy rainfall expected in next 48 hours. Avoid irrigation for next 3 days.',
      validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'pest',
      priority: 'medium',
      title: 'Pest Management',
      description: 'High humidity may increase pest activity. Monitor crops closely.',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    },
    {
      type: 'harvesting',
      priority: 'low',
      title: 'Harvesting Window',
      description: 'Good weather conditions expected for harvesting operations this weekend.',
      validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    }
  ];
}

// Run the seeding function
seedDatabase();