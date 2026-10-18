const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user alerts
router.get('/', auth, async (req, res) => {
  try {
    const { type, priority, limit = 20, page = 1 } = req.query;
    
    // Mock alerts data - in production, this would come from database
    let alerts = generateUserAlerts(req.userId, type, priority);
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedAlerts = alerts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(alerts.length / parseInt(limit)),
          count: paginatedAlerts.length,
          totalRecords: alerts.length
        }
      }
    });

  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
});

// Get alert by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock alert data - in production, fetch from database
    const alert = {
      id,
      type: 'weather',
      priority: 'high',
      title: 'Heavy Rainfall Alert',
      message: 'Heavy rainfall expected in your area within next 24-48 hours. Take necessary precautions for your crops.',
      details: {
        expectedRainfall: '75-100mm',
        duration: '24-36 hours',
        affectedAreas: ['Punjab', 'Haryana', 'Western UP'],
        recommendations: [
          'Ensure proper drainage in fields',
          'Postpone harvesting operations',
          'Secure farm equipment and stored produce',
          'Monitor weather updates regularly'
        ]
      },
      isRead: false,
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      source: 'India Meteorological Department',
      actionRequired: true
    };

    res.json({
      success: true,
      data: alert
    });

  } catch (error) {
    console.error('Alert fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert details'
    });
  }
});

// Mark alert as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In production, update alert status in database
    // await Alert.findByIdAndUpdate(id, { isRead: true, readAt: new Date() });

    res.json({
      success: true,
      message: 'Alert marked as read'
    });

  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alert as read'
    });
  }
});

// Mark all alerts as read
router.put('/read-all', auth, async (req, res) => {
  try {
    // In production, update all user alerts in database
    // await Alert.updateMany({ userId: req.userId, isRead: false }, { isRead: true, readAt: new Date() });

    res.json({
      success: true,
      message: 'All alerts marked as read'
    });

  } catch (error) {
    console.error('Mark all alerts read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all alerts as read'
    });
  }
});

// Delete alert
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // In production, delete alert from database
    // await Alert.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });

  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert'
    });
  }
});

// Get alert statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = {
      total: 25,
      unread: 8,
      byType: {
        weather: 12,
        price: 6,
        policy: 4,
        cultivation: 3
      },
      byPriority: {
        critical: 2,
        high: 8,
        medium: 10,
        low: 5
      },
      recent: {
        today: 3,
        thisWeek: 12,
        thisMonth: 25
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Alert stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert statistics'
    });
  }
});

// Helper function to generate mock alerts
function generateUserAlerts(userId, type, priority) {
  const alertTypes = ['weather', 'price', 'policy', 'cultivation', 'pest', 'market'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  
  const mockAlerts = [
    {
      id: '1',
      type: 'weather',
      priority: 'high',
      title: 'Heavy Rainfall Alert',
      message: 'Heavy rainfall expected in next 48 hours. Secure your crops and equipment.',
      isRead: false,
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
      actionRequired: true,
      source: 'IMD'
    },
    {
      id: '2',
      type: 'price',
      priority: 'medium',
      title: 'Wheat Price Increase',
      message: 'Wheat prices have increased by 5% in your local market.',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      actionRequired: false,
      source: 'Market Data'
    },
    {
      id: '3',
      type: 'policy',
      priority: 'medium',
      title: 'New Subsidy Scheme',
      message: 'New fertilizer subsidy scheme announced. Application deadline: 30 days.',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      actionRequired: true,
      source: 'Government'
    },
    {
      id: '4',
      type: 'cultivation',
      priority: 'low',
      title: 'Optimal Sowing Time',
      message: 'This is the optimal time for sowing rabi crops in your region.',
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      actionRequired: false,
      source: 'Agricultural Advisory'
    },
    {
      id: '5',
      type: 'pest',
      priority: 'high',
      title: 'Pest Attack Warning',
      message: 'Brown plant hopper attack reported in nearby areas. Monitor your crops.',
      isRead: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000),
      actionRequired: true,
      source: 'Plant Protection'
    },
    {
      id: '6',
      type: 'market',
      priority: 'medium',
      title: 'Market Day Reminder',
      message: 'Tomorrow is market day. Current prices are favorable for selling.',
      isRead: false,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actionRequired: false,
      source: 'Market Advisory'
    },
    {
      id: '7',
      type: 'weather',
      priority: 'critical',
      title: 'Cyclone Warning',
      message: 'Severe cyclonic storm approaching. Take immediate protective measures.',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actionRequired: true,
      source: 'IMD'
    },
    {
      id: '8',
      type: 'cultivation',
      priority: 'medium',
      title: 'Fertilizer Application Time',
      message: 'Time for second dose of fertilizer application for better yield.',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      actionRequired: true,
      source: 'Crop Advisory'
    }
  ];

  // Filter by type if specified
  let filteredAlerts = mockAlerts;
  if (type && alertTypes.includes(type)) {
    filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
  }

  // Filter by priority if specified
  if (priority && priorities.includes(priority)) {
    filteredAlerts = filteredAlerts.filter(alert => alert.priority === priority);
  }

  // Sort by creation date (newest first)
  filteredAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return filteredAlerts;
}

module.exports = router;