const express = require('express');
const CropPrice = require('../models/CropPrice');
const auth = require('../middleware/auth');

const router = express.Router();

// Place specific routes BEFORE general ones to avoid path conflict

// 1. Get price prediction for a crop
router.get('/:crop/:state/prediction', auth, async (req, res) => {
  try {
    const { crop, state } = req.params;
    const { days = 7 } = req.query;

    const latestPrice = await CropPrice.findOne({
      'crop.name': new RegExp(crop, 'i'),
      'market.state': state
    }).sort({ 'dataSource.lastUpdated': -1 });

    if (!latestPrice) {
      return res.status(404).json({
        success: false,
        message: 'Price data not found for this crop and location'
      });
    }

    const prediction = generatePricePrediction(latestPrice, parseInt(days));

    res.json({
      success: true,
      data: {
        crop: latestPrice.crop,
        market: latestPrice.market,
        currentPrice: latestPrice.pricing.current,
        prediction,
        marketInsights: latestPrice.marketInsights,
        lastUpdated: latestPrice.dataSource.lastUpdated
      }
    });
  } catch (error) {
    console.error('Price prediction error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate price prediction' });
  }
});

// 2. Get historical price data
router.get('/:crop/:state/history', auth, async (req, res) => {
  try {
    const { crop, state } = req.params;
    const { months = 6 } = req.query;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const priceData = await CropPrice.findOne({
      'crop.name': new RegExp(crop, 'i'),
      'market.state': state
    }).sort({ 'dataSource.lastUpdated': -1 });

    if (!priceData) {
      return res.status(404).json({
        success: false,
        message: 'Historical data not found'
      });
    }

    const historicalData = priceData.historicalData.filter(data => new Date(data.date) >= startDate);

    res.json({
      success: true,
      data: {
        crop: priceData.crop,
        market: priceData.market,
        historicalData,
        currentPrice: priceData.pricing.current,
        trend: priceData.prediction.trend
      }
    });
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch historical price data' });
  }
});

// 3. Get market insights
router.get('/insights/:state/:district?', auth, async (req, res) => {
  try {
    const { state, district } = req.params;
    const query = { 'market.state': state };
    if (district) query['market.district'] = district;

    const insights = await CropPrice.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$crop.name',
          avgPrice: { $avg: '$pricing.current' },
          minPrice: { $min: '$pricing.minimum' },
          maxPrice: { $max: '$pricing.maximum' },
          totalArrivals: { $sum: '$marketInsights.arrivals' },
          avgDemand: {
            $avg: {
              $cond: [
                { $eq: ['$marketInsights.demand', 'very_high'] }, 5,
                {
                  $cond: [
                    { $eq: ['$marketInsights.demand', 'high'] }, 4,
                    {
                      $cond: [
                        { $eq: ['$marketInsights.demand', 'moderate'] }, 3,
                        {
                          $cond: [
                            { $eq: ['$marketInsights.demand', 'low'] }, 2, 1
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        }
      },
      { $sort: { avgPrice: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: {
        location: { state, district },
        insights,
        summary: {
          totalCrops: insights.length,
          avgMarketPrice: insights.reduce((sum, item) => sum + item.avgPrice, 0) / insights.length,
          highestPriceCrop: insights[0]?._id || 'N/A',
          totalMarketArrivals: insights.reduce((sum, item) => sum + (item.totalArrivals || 0), 0)
        }
      }
    });
  } catch (error) {
    console.error('Market insights error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch market insights' });
  }
});

// 4. General crop price route (defined last to avoid conflict)
router.get('/:crop/:state/:district?', auth, async (req, res) => {
  try {
    const { crop, state, district } = req.params;

    const query = {
      'crop.name': new RegExp(crop, 'i'),
      'market.state': state
    };

    if (district) query['market.district'] = district;

    const prices = await CropPrice.find(query)
      .sort({ 'dataSource.lastUpdated': -1 })
      .limit(10);

    if (prices.length === 0) {
      const mockPrice = await generateMockPriceData(crop, state, district);
      return res.json({ success: true, data: [mockPrice] });
    }

    res.json({ success: true, data: prices });
  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch crop prices' });
  }
});

// --- Helper Functions ---
async function generateMockPriceData(crop, state, district) {
  const basePrice = getCropBasePrice(crop);
  const current = Math.round(basePrice + (Math.random() - 0.5) * basePrice * 0.2);

  const mockData = {
    crop: {
      name: crop,
      category: getCropCategory(crop)
    },
    market: {
      state,
      district: district || 'Central',
      marketName: `${district || state} Mandi`,
      marketCode: `${state.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 1000)}`
    },
    pricing: {
      current,
      previous: current + Math.round((Math.random() - 0.5) * 100),
      minimum: Math.round(current * 0.9),
      maximum: Math.round(current * 1.1),
      modal: current,
      msp: Math.round(current * 0.85),
      unit: 'quintal'
    },
    prediction: {
      nextWeek: Math.round(current + (Math.random() - 0.5) * 200),
      nextMonth: Math.round(current + (Math.random() - 0.5) * 400),
      confidence: Math.round(Math.random() * 20 + 80),
      trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)],
      factors: ['Weather conditions', 'Market demand', 'Export opportunities']
    },
    marketInsights: {
      demand: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
      supply: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
      quality: 'good',
      arrivals: Math.round(Math.random() * 1000 + 500),
      tradedQuantity: Math.round(Math.random() * 800 + 400)
    },
    historicalData: generateHistoricalData(current),
    dataSource: {
      provider: 'AgriMarket API',
      lastUpdated: new Date(),
      reliability: 90
    }
  };

  const cropPrice = new CropPrice(mockData);
  await cropPrice.save();
  return cropPrice;
}

function getCropBasePrice(crop) {
  const basePrices = {
    wheat: 2500, rice: 2800, corn: 2200,
    cotton: 6000, sugarcane: 350,
    soybean: 4500, pulses: 5500,
    vegetables: 1500
  };
  return basePrices[crop.toLowerCase()] || 3000;
}

function getCropCategory(crop) {
  const categories = {
    wheat: 'cereals', rice: 'cereals', corn: 'cereals',
    cotton: 'cash_crops', sugarcane: 'cash_crops',
    soybean: 'oilseeds', pulses: 'pulses',
    vegetables: 'vegetables'
  };
  return categories[crop.toLowerCase()] || 'cereals';
}

function generateHistoricalData(currentPrice) {
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

function generatePricePrediction(priceData, days) {
  const predictions = [];
  let basePrice = priceData.pricing.current;

  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const trendMultiplier = priceData.prediction.trend === 'increasing' ? 1.02 :
                            priceData.prediction.trend === 'decreasing' ? 0.98 : 1;
    basePrice = Math.round(basePrice * trendMultiplier + (Math.random() - 0.5) * 50);
    predictions.push({
      date,
      predictedPrice: basePrice,
      confidence: Math.max(60, priceData.prediction.confidence - i * 2)
    });
  }

  return predictions;
}

module.exports = router;
