const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Get cultivation techniques for specific crop and season
router.get('/:crop/:season?', auth, async (req, res) => {
  try {
    const { crop, season } = req.params;
    const { state, soilType } = req.query;

    const cultivationData = getCultivationTechniques(crop, season, state, soilType);

    res.json({
      success: true,
      data: cultivationData
    });

  } catch (error) {
    console.error('Cultivation techniques error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cultivation techniques'
    });
  }
});

// Get seasonal calendar for a crop
router.get('/:crop/calendar/:state?', auth, async (req, res) => {
  try {
    const { crop, state } = req.params;

    const calendar = getSeasonalCalendar(crop, state);

    res.json({
      success: true,
      data: calendar
    });

  } catch (error) {
    console.error('Seasonal calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seasonal calendar'
    });
  }
});

// Get pest and disease management
router.get('/:crop/pest-management', auth, async (req, res) => {
  try {
    const { crop } = req.params;
    const { season, region } = req.query;

    const pestManagement = getPestManagement(crop, season, region);

    res.json({
      success: true,
      data: pestManagement
    });

  } catch (error) {
    console.error('Pest management error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pest management data'
    });
  }
});

// Get fertilizer recommendations
router.get('/:crop/fertilizer/:soilType?', auth, async (req, res) => {
  try {
    const { crop, soilType } = req.params;
    const { stage, area } = req.query;

    const fertilizerRecommendations = getFertilizerRecommendations(crop, soilType, stage, area);

    res.json({
      success: true,
      data: fertilizerRecommendations
    });

  } catch (error) {
    console.error('Fertilizer recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fertilizer recommendations'
    });
  }
});

// Get modern farming techniques
router.get('/techniques/modern', auth, async (req, res) => {
  try {
    const { category, cropType } = req.query;

    const modernTechniques = getModernFarmingTechniques(category, cropType);

    res.json({
      success: true,
      data: modernTechniques
    });

  } catch (error) {
    console.error('Modern techniques error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch modern farming techniques'
    });
  }
});

// Helper functions
function getCultivationTechniques(crop, season, state, soilType) {
  const techniques = {
    crop,
    season: season || 'kharif',
    location: state,
    soilType,
    techniques: [
      {
        stage: 'Land Preparation',
        timing: 'Pre-sowing (15-20 days before)',
        activities: [
          'Deep ploughing to break hardpan',
          'Add organic matter (FYM/compost)',
          'Level the field properly',
          'Install drainage system if needed'
        ],
        tips: [
          'Avoid working on wet soil',
          'Use laser land leveling for better water management',
          'Test soil pH and adjust if necessary'
        ]
      },
      {
        stage: 'Sowing',
        timing: getOptimalSowingTime(crop, season, state),
        activities: [
          'Select certified seeds',
          'Treat seeds with fungicide',
          'Maintain proper spacing',
          'Ensure adequate soil moisture'
        ],
        tips: [
          'Use seed drill for uniform sowing',
          'Monitor weather forecast before sowing',
          'Keep backup seeds ready'
        ]
      },
      {
        stage: 'Crop Management',
        timing: 'Throughout growing season',
        activities: [
          'Regular monitoring for pests and diseases',
          'Timely irrigation based on crop stage',
          'Weed management',
          'Nutrient management'
        ],
        tips: [
          'Use integrated pest management',
          'Apply fertilizers based on soil test',
          'Maintain field records'
        ]
      },
      {
        stage: 'Harvesting',
        timing: getHarvestingTime(crop, season),
        activities: [
          'Monitor crop maturity indicators',
          'Choose appropriate harvesting method',
          'Proper drying and storage',
          'Quality assessment'
        ],
        tips: [
          'Harvest at optimal moisture content',
          'Avoid harvesting during rain',
          'Use proper storage techniques'
        ]
      }
    ],
    bestPractices: getBestPractices(crop),
    commonProblems: getCommonProblems(crop),
    expectedYield: getExpectedYield(crop, state),
    costEstimation: getCostEstimation(crop)
  };

  return techniques;
}

function getSeasonalCalendar(crop, state) {
  const calendar = {
    crop,
    location: state,
    seasons: {
      kharif: {
        sowing: 'June-July',
        transplanting: 'July-August',
        harvesting: 'October-November',
        activities: [
          { month: 'May', activity: 'Land preparation, seed procurement' },
          { month: 'June', activity: 'Sowing, nursery preparation' },
          { month: 'July', activity: 'Transplanting, first irrigation' },
          { month: 'August', activity: 'Weed management, pest monitoring' },
          { month: 'September', activity: 'Fertilizer application, disease control' },
          { month: 'October', activity: 'Maturity monitoring, harvest preparation' },
          { month: 'November', activity: 'Harvesting, post-harvest handling' }
        ]
      },
      rabi: {
        sowing: 'November-December',
        harvesting: 'March-April',
        activities: [
          { month: 'October', activity: 'Land preparation after kharif harvest' },
          { month: 'November', activity: 'Sowing, irrigation setup' },
          { month: 'December', activity: 'First irrigation, weed control' },
          { month: 'January', activity: 'Fertilizer application, pest monitoring' },
          { month: 'February', activity: 'Disease management, irrigation' },
          { month: 'March', activity: 'Maturity assessment, harvest planning' },
          { month: 'April', activity: 'Harvesting, storage preparation' }
        ]
      }
    },
    criticalStages: getCriticalStages(crop),
    weatherRequirements: getWeatherRequirements(crop)
  };

  return calendar;
}

function getPestManagement(crop, season, region) {
  return {
    crop,
    season,
    region,
    commonPests: [
      {
        name: 'Stem Borer',
        symptoms: ['Dead hearts in vegetative stage', 'White ears in reproductive stage'],
        management: [
          'Use pheromone traps',
          'Apply neem-based pesticides',
          'Maintain field hygiene',
          'Use resistant varieties'
        ],
        criticalPeriod: 'Tillering to flowering stage',
        organicControl: ['Neem oil spray', 'Trichogramma release', 'Light traps'],
        chemicalControl: ['Chlorantraniliprole', 'Fipronil', 'Cartap hydrochloride']
      },
      {
        name: 'Leaf Folder',
        symptoms: ['Folded leaves with feeding marks', 'Reduced photosynthesis'],
        management: [
          'Remove affected leaves',
          'Use biological control agents',
          'Spray recommended insecticides',
          'Maintain proper plant spacing'
        ],
        criticalPeriod: 'Vegetative growth stage',
        organicControl: ['Bacillus thuringiensis', 'Neem extract'],
        chemicalControl: ['Lambda cyhalothrin', 'Chlorpyrifos']
      }
    ],
    diseases: [
      {
        name: 'Blast',
        symptoms: ['Diamond-shaped lesions on leaves', 'Neck rot in panicles'],
        management: [
          'Use resistant varieties',
          'Avoid excessive nitrogen',
          'Ensure proper drainage',
          'Apply fungicides preventively'
        ],
        favorableConditions: 'High humidity, moderate temperature',
        organicControl: ['Pseudomonas spray', 'Trichoderma application'],
        chemicalControl: ['Tricyclazole', 'Propiconazole', 'Azoxystrobin']
      }
    ],
    integratedApproach: [
      'Use certified disease-free seeds',
      'Follow crop rotation',
      'Maintain field sanitation',
      'Monitor regularly for early detection',
      'Use economic threshold levels',
      'Combine biological and chemical methods'
    ]
  };
}

function getFertilizerRecommendations(crop, soilType, stage, area) {
  const baseRecommendation = {
    crop,
    soilType: soilType || 'loamy',
    area: area || '1 acre',
    recommendations: {
      basal: {
        nitrogen: '60 kg/ha',
        phosphorus: '30 kg/ha',
        potassium: '30 kg/ha',
        application: 'At the time of sowing/transplanting'
      },
      topDressing: [
        {
          stage: 'Tillering',
          timing: '20-25 days after sowing',
          fertilizer: 'Urea 30 kg/ha',
          notes: 'Apply when soil has adequate moisture'
        },
        {
          stage: 'Panicle initiation',
          timing: '40-45 days after sowing',
          fertilizer: 'Urea 30 kg/ha',
          notes: 'Critical stage for yield determination'
        }
      ],
      micronutrients: [
        {
          nutrient: 'Zinc',
          deficiencySymptoms: ['Yellowing between leaf veins', 'Stunted growth'],
          application: 'ZnSO4 25 kg/ha as basal or foliar spray',
          timing: 'Basal application or 2-3 foliar sprays'
        },
        {
          nutrient: 'Iron',
          deficiencySymptoms: ['Interveinal chlorosis', 'Reduced tillering'],
          application: 'FeSO4 foliar spray 0.5%',
          timing: 'When deficiency symptoms appear'
        }
      ]
    },
    organicAlternatives: {
      nitrogen: 'FYM 10 tons/ha, Vermicompost 5 tons/ha',
      phosphorus: 'Rock phosphate 200 kg/ha',
      potassium: 'Wood ash 500 kg/ha',
      micronutrients: 'Compost enriched with micronutrients'
    },
    soilSpecificAdjustments: getSoilSpecificAdjustments(soilType),
    costAnalysis: {
      chemical: '₹8,000-12,000 per hectare',
      organic: '₹15,000-20,000 per hectare',
      integrated: '₹10,000-15,000 per hectare'
    }
  };

  return baseRecommendation;
}

function getModernFarmingTechniques(category, cropType) {
  return {
    category: category || 'all',
    cropType,
    techniques: [
      {
        name: 'Precision Agriculture',
        description: 'Use of GPS, sensors, and data analytics for precise farming',
        benefits: [
          'Reduced input costs by 15-20%',
          'Increased yield by 10-15%',
          'Better resource utilization',
          'Environmental sustainability'
        ],
        implementation: [
          'Install soil sensors for moisture and nutrient monitoring',
          'Use GPS-guided tractors for precise operations',
          'Implement variable rate technology for fertilizer application',
          'Use drones for crop monitoring and spraying'
        ],
        investment: '₹2-5 lakhs per hectare',
        roi: '2-3 years',
        suitability: 'Large farms (>10 acres)'
      },
      {
        name: 'Drip Irrigation',
        description: 'Efficient water delivery system for optimal crop growth',
        benefits: [
          'Water saving up to 50%',
          'Increased crop yield by 20-30%',
          'Reduced labor costs',
          'Better nutrient management'
        ],
        implementation: [
          'Design irrigation layout based on crop spacing',
          'Install main and sub-main pipelines',
          'Set up drippers and emitters',
          'Install filtration and fertigation systems'
        ],
        investment: '₹80,000-1,20,000 per hectare',
        roi: '3-4 years',
        suitability: 'All farm sizes, especially water-scarce areas'
      },
      {
        name: 'Integrated Pest Management (IPM)',
        description: 'Holistic approach to pest control using multiple methods',
        benefits: [
          'Reduced pesticide use by 30-40%',
          'Lower production costs',
          'Environmental protection',
          'Sustainable pest control'
        ],
        implementation: [
          'Regular field monitoring and pest identification',
          'Use of biological control agents',
          'Pheromone traps and light traps',
          'Selective use of eco-friendly pesticides'
        ],
        investment: '₹5,000-10,000 per hectare',
        roi: '1-2 years',
        suitability: 'All crops and farm sizes'
      },
      {
        name: 'Soil Health Management',
        description: 'Comprehensive approach to maintain and improve soil fertility',
        benefits: [
          'Improved soil structure and fertility',
          'Better water retention',
          'Increased organic matter',
          'Sustainable productivity'
        ],
        implementation: [
          'Regular soil testing and analysis',
          'Application of organic amendments',
          'Cover cropping and green manuring',
          'Minimal tillage practices'
        ],
        investment: '₹10,000-15,000 per hectare annually',
        roi: 'Long-term (5+ years)',
        suitability: 'All farming systems'
      }
    ],
    technologyAdoption: {
      smartphones: 'Weather apps, market price apps, advisory services',
      sensors: 'Soil moisture, temperature, humidity monitoring',
      drones: 'Crop monitoring, spraying, mapping',
      ai: 'Crop disease identification, yield prediction'
    },
    governmentSupport: [
      'Subsidies on modern equipment (50-80%)',
      'Training programs on new technologies',
      'Demonstration plots for technology showcase',
      'Credit facilities for technology adoption'
    ]
  };
}

// Additional helper functions
function getOptimalSowingTime(crop, season, state) {
  const sowingTimes = {
    wheat: { kharif: 'Not applicable', rabi: 'November 15 - December 15' },
    rice: { kharif: 'June 15 - July 15', rabi: 'December - January' },
    cotton: { kharif: 'May 15 - June 15', rabi: 'Not applicable' },
    sugarcane: { kharif: 'February - March', rabi: 'October - November' }
  };

  return sowingTimes[crop]?.[season] || 'Consult local agricultural officer';
}

function getHarvestingTime(crop, season) {
  const harvestTimes = {
    wheat: { rabi: 'March 15 - April 15' },
    rice: { kharif: 'October 15 - November 15', rabi: 'April - May' },
    cotton: { kharif: 'October - December' },
    sugarcane: { annual: 'December - March' }
  };

  return harvestTimes[crop]?.[season] || 'Monitor crop maturity indicators';
}

function getBestPractices(crop) {
  return [
    'Use certified seeds from authorized dealers',
    'Follow recommended spacing and planting depth',
    'Implement integrated nutrient management',
    'Practice water-efficient irrigation methods',
    'Maintain detailed farm records',
    'Follow crop rotation for soil health',
    'Use weather-based advisory services',
    'Adopt post-harvest management practices'
  ];
}

function getCommonProblems(crop) {
  return [
    {
      problem: 'Poor germination',
      causes: ['Low seed quality', 'Inadequate soil moisture', 'Improper sowing depth'],
      solutions: ['Use certified seeds', 'Ensure proper irrigation', 'Follow recommended sowing practices']
    },
    {
      problem: 'Yellowing of leaves',
      causes: ['Nutrient deficiency', 'Waterlogging', 'Disease infection'],
      solutions: ['Soil testing and balanced fertilization', 'Improve drainage', 'Disease management']
    },
    {
      problem: 'Low yield',
      causes: ['Poor variety selection', 'Inadequate nutrition', 'Pest and disease damage'],
      solutions: ['Choose high-yielding varieties', 'Follow fertilizer recommendations', 'Implement IPM']
    }
  ];
}

function getExpectedYield(crop, state) {
  const yields = {
    wheat: { average: '40-45 quintals/hectare', potential: '60-70 quintals/hectare' },
    rice: { average: '35-40 quintals/hectare', potential: '55-65 quintals/hectare' },
    cotton: { average: '15-20 quintals/hectare', potential: '25-30 quintals/hectare' }
  };

  return yields[crop] || { average: 'Consult local experts', potential: 'Varies by variety and management' };
}

function getCostEstimation(crop) {
  return {
    seeds: '₹3,000-5,000 per hectare',
    fertilizers: '₹8,000-12,000 per hectare',
    pesticides: '₹3,000-5,000 per hectare',
    labor: '₹15,000-20,000 per hectare',
    machinery: '₹8,000-12,000 per hectare',
    irrigation: '₹2,000-4,000 per hectare',
    total: '₹39,000-58,000 per hectare',
    note: 'Costs may vary based on location, input prices, and farming practices'
  };
}

function getCriticalStages(crop) {
  return [
    { stage: 'Germination', importance: 'Determines plant population' },
    { stage: 'Tillering', importance: 'Affects final yield potential' },
    { stage: 'Flowering', importance: 'Critical for grain formation' },
    { stage: 'Grain filling', importance: 'Determines grain weight and quality' }
  ];
}

function getWeatherRequirements(crop) {
  return {
    temperature: '20-35°C (optimal range)',
    rainfall: '1000-1500mm annually',
    humidity: '60-80% during growing season',
    sunshine: '6-8 hours daily',
    criticalPeriods: [
      'Avoid extreme temperatures during flowering',
      'Adequate moisture during grain filling',
      'Dry weather during harvesting'
    ]
  };
}

function getSoilSpecificAdjustments(soilType) {
  const adjustments = {
    clay: {
      drainage: 'Improve drainage to prevent waterlogging',
      tillage: 'Deep ploughing when soil moisture is optimal',
      fertilizer: 'Split application to prevent nutrient loss'
    },
    sandy: {
      waterManagement: 'Frequent light irrigations',
      organicMatter: 'Increase organic matter content',
      fertilizer: 'More frequent applications in smaller doses'
    },
    loamy: {
      management: 'Ideal soil type, follow standard recommendations',
      maintenance: 'Maintain organic matter levels'
    }
  };

  return adjustments[soilType] || adjustments.loamy;
}

module.exports = router;