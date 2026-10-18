const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('location.state').optional().notEmpty(),
  body('location.district').optional().notEmpty(),
  body('farmDetails.size').optional().notEmpty(),
  body('farmDetails.primaryCrop').optional().notEmpty(),
  body('profile.phone').optional().isMobilePhone('en-IN')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'location', 'farmDetails', 'preferences', 'profile'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field]) {
        if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
          user[field] = { ...user[field].toObject(), ...req.body[field] };
        } else {
          user[field] = req.body[field];
        }
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.getPublicProfile()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user preferences
router.put('/preferences', auth, [
  body('language').optional().isIn(['hi-IN', 'en-IN', 'pa-IN', 'gu-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN']),
  body('notifications').optional().isObject(),
  body('units').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update preferences
    user.preferences = { ...user.preferences.toObject(), ...req.body };
    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Compile dashboard data
    const dashboardData = {
      user: user.getPublicProfile(),
      stats: {
        farmSize: user.farmDetails.size,
        primaryCrop: user.farmDetails.primaryCrop,
        location: `${user.location.district}, ${user.location.state}`,
        memberSince: user.createdAt,
        lastLogin: user.lastLogin
      },
      quickActions: [
        { name: 'Weather Forecast', path: '/weather', icon: 'cloud' },
        { name: 'Crop Prices', path: '/prices', icon: 'trending-up' },
        { name: 'Government Policies', path: '/policies', icon: 'file-text' },
        { name: 'Cultivation Tips', path: '/cultivation', icon: 'sprout' }
      ],
      recentAlerts: [
        {
          type: 'weather',
          message: 'Heavy rainfall expected in next 48 hours',
          priority: 'high',
          timestamp: new Date()
        },
        {
          type: 'price',
          message: `${user.farmDetails.primaryCrop} prices increased by 5%`,
          priority: 'medium',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Change password
router.put('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete user account
router.delete('/account', auth, [
  body('password').notEmpty().withMessage('Password is required for account deletion')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { password } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = {
      profile: {
        completeness: calculateProfileCompleteness(user),
        memberSince: user.createdAt,
        lastActive: user.lastLogin
      },
      usage: {
        totalLogins: user.loginCount || 0,
        preferredLanguage: user.preferences.language,
        notificationSettings: user.preferences.notifications
      },
      farm: {
        size: user.farmDetails.size,
        primaryCrop: user.farmDetails.primaryCrop,
        secondaryCrops: user.farmDetails.secondaryCrops || [],
        farmingType: user.farmDetails.farmingType,
        soilType: user.farmDetails.soilType
      },
      subscription: {
        plan: user.subscription.plan,
        features: user.subscription.features || [],
        expiresAt: user.subscription.expiresAt
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to calculate profile completeness
function calculateProfileCompleteness(user) {
  const requiredFields = [
    'name', 'email', 'location.state', 'location.district',
    'farmDetails.size', 'farmDetails.primaryCrop'
  ];
  
  const optionalFields = [
    'profile.phone', 'profile.avatar', 'farmDetails.soilType',
    'farmDetails.secondaryCrops', 'location.coordinates'
  ];

  let completed = 0;
  let total = requiredFields.length + optionalFields.length;

  // Check required fields
  requiredFields.forEach(field => {
    if (getNestedValue(user, field)) {
      completed++;
    }
  });

  // Check optional fields
  optionalFields.forEach(field => {
    if (getNestedValue(user, field)) {
      completed++;
    }
  });

  return Math.round((completed / total) * 100);
}

// Helper function to get nested object values
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}

module.exports = router;