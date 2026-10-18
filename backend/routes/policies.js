const express = require('express');
const Policy = require('../models/Policy');
const auth = require('../middleware/auth');

const router = express.Router();

// Get policies for a specific state/location
router.get('/:state?', auth, async (req, res) => {
  try {
    const { state } = req.params;
    const { category, level, status = 'active', page = 1, limit = 20 } = req.query;

    // Build query
    const query = { status };

    if (state) {
      query.$or = [
        { applicableStates: { $in: [state] } },
        { applicableStates: { $size: 0 } }, // Policies applicable to all states
        { level: 'central' }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (level) {
      query.level = level;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const policies = await Policy.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Policy.countDocuments(query);

    // If no policies found, generate some mock data
    if (policies.length === 0 && page === 1) {
      await generateMockPolicies(state);
      return res.redirect(`/api/policies/${state || ''}`);
    }

    res.json({
      success: true,
      data: {
        policies,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: policies.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('Policies fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policies'
    });
  }
});

// Search policies
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    const { state, category, page = 1, limit = 20 } = req.query;

    const searchQuery = {
      $text: { $search: query },
      status: 'active'
    };

    if (state) {
      searchQuery.$or = [
        { applicableStates: { $in: [state] } },
        { applicableStates: { $size: 0 } },
        { level: 'central' }
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const policies = await Policy.find(searchQuery)
      .sort({ score: { $meta: 'textScore' }, priority: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Policy.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        policies,
        searchQuery: query,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: policies.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('Policy search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search policies'
    });
  }
});

// Get policy details by ID
router.get('/details/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const policy = await Policy.findById(id);
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    res.json({
      success: true,
      data: policy
    });

  } catch (error) {
    console.error('Policy details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy details'
    });
  }
});

// Get policy categories
router.get('/meta/categories', auth, async (req, res) => {
  try {
    const categories = await Policy.distinct('category', { status: 'active' });
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Get policies by eligibility (personalized recommendations)
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { farmSize, cropTypes, state, district, farmerCategory } = req.body;

    const query = {
      status: 'active',
      $or: [
        { applicableStates: { $in: [state] } },
        { applicableStates: { $size: 0 } },
        { level: 'central' }
      ]
    };

    // Add eligibility filters
    if (farmSize) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'eligibility.farmSize': { $exists: false } },
          {
            $and: [
              { 'eligibility.farmSize.min': { $lte: parseFloat(farmSize) } },
              { 'eligibility.farmSize.max': { $gte: parseFloat(farmSize) } }
            ]
          }
        ]
      });
    }

    if (cropTypes && cropTypes.length > 0) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'eligibility.cropTypes': { $size: 0 } },
          { 'eligibility.cropTypes': { $in: cropTypes } }
        ]
      });
    }

    if (farmerCategory) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'eligibility.farmerCategory': { $size: 0 } },
          { 'eligibility.farmerCategory': { $in: [farmerCategory] } }
        ]
      });
    }

    const recommendations = await Policy.find(query)
      .sort({ priority: -1, 'benefits.financial.amount': -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        recommendations,
        criteria: { farmSize, cropTypes, state, district, farmerCategory },
        count: recommendations.length
      }
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch policy recommendations'
    });
  }
});

// Helper function to generate mock policies
async function generateMockPolicies(state) {
  const mockPolicies = [
    {
      title: 'Pradhan Mantri Fasal Bima Yojana',
      description: 'Comprehensive crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities, pests & diseases.',
      category: 'insurance',
      level: 'central',
      applicableStates: [],
      eligibility: {
        criteria: ['All farmers growing notified crops', 'Sharecroppers and tenant farmers eligible'],
        farmSize: { min: 0, max: 1000, unit: 'acres' },
        cropTypes: ['wheat', 'rice', 'cotton', 'sugarcane', 'oilseeds'],
        farmerCategory: ['small', 'marginal', 'large']
      },
      benefits: {
        financial: {
          amount: 200000,
          type: 'percentage',
          maxAmount: 200000
        },
        description: 'Coverage up to 100% of sum insured for crop losses'
      },
      applicationProcess: {
        steps: [
          'Visit nearest bank or CSC center',
          'Fill application form with required documents',
          'Pay premium amount',
          'Receive policy document'
        ],
        documents: ['Aadhaar Card', 'Bank Account Details', 'Land Records', 'Sowing Certificate'],
        onlinePortal: 'https://pmfby.gov.in',
        processingTime: '15-30 days'
      },
      timeline: {
        isOngoing: true,
        applicationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      },
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
      title: 'PM-KISAN Scheme',
      description: 'Direct income support scheme providing ₹6,000 per year to eligible farmer families in three equal installments.',
      category: 'subsidy',
      level: 'central',
      applicableStates: [],
      eligibility: {
        criteria: ['Small and marginal farmers', 'Landholding farmers'],
        farmSize: { min: 0, max: 5, unit: 'acres' },
        farmerCategory: ['small', 'marginal']
      },
      benefits: {
        financial: {
          amount: 6000,
          type: 'lump_sum'
        },
        description: '₹2,000 per installment, three times a year'
      },
      applicationProcess: {
        steps: [
          'Register on PM-KISAN portal',
          'Provide Aadhaar and bank details',
          'Village level verification',
          'Approval and payment'
        ],
        documents: ['Aadhaar Card', 'Bank Account Details', 'Land Ownership Documents'],
        onlinePortal: 'https://pmkisan.gov.in',
        processingTime: '30-45 days'
      },
      timeline: {
        isOngoing: true
      },
      contactInfo: {
        department: 'Department of Agriculture & Farmers Welfare',
        phone: '155261',
        email: 'pmkisan-ict@gov.in',
        website: 'https://pmkisan.gov.in'
      },
      priority: 'high',
      status: 'active',
      tags: ['income support', 'direct benefit transfer', 'financial assistance']
    }
  ];

  // Add state-specific policies if state is provided
  if (state) {
    const statePolicy = {
      title: `${state} Agricultural Development Scheme`,
      description: `State-specific agricultural support and development scheme for ${state} farmers including subsidies, training, and technology adoption.`,
      category: 'subsidy',
      level: 'state',
      applicableStates: [state],
      eligibility: {
        criteria: [`${state} resident farmers`, 'Valid land ownership documents'],
        farmSize: { min: 0, max: 50, unit: 'acres' }
      },
      benefits: {
        financial: {
          amount: 25000,
          type: 'lump_sum'
        },
        description: 'Equipment subsidies, seed support, and training programs'
      },
      applicationProcess: {
        steps: [
          'Visit district agriculture office',
          'Submit application with documents',
          'Field verification',
          'Approval and disbursement'
        ],
        documents: ['Residence Certificate', 'Land Records', 'Aadhaar Card', 'Bank Details'],
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
      tags: ['state scheme', 'agricultural development', 'subsidies']
    };

    mockPolicies.push(statePolicy);
  }

  // Save mock policies to database
  for (const policyData of mockPolicies) {
    const existingPolicy = await Policy.findOne({ title: policyData.title });
    if (!existingPolicy) {
      const policy = new Policy(policyData);
      await policy.save();
    }
  }
}

module.exports = router;