const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  location: {
    state: {
      type: String,
      required: [true, 'State is required']
    },
    district: {
      type: String,
      required: [true, 'District is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  farmDetails: {
    size: {
      type: String,
      required: [true, 'Farm size is required']
    },
    primaryCrop: {
      type: String,
      required: [true, 'Primary crop is required']
    },
    secondaryCrops: [String],
    farmingType: {
      type: String,
      enum: ['organic', 'conventional', 'mixed'],
      default: 'conventional'
    },
    soilType: {
      type: String,
      enum: ['clay', 'sandy', 'loamy', 'silt', 'mixed']
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'hi-IN'
    },
    notifications: {
      weather: { type: Boolean, default: true },
      prices: { type: Boolean, default: true },
      policies: { type: Boolean, default: true },
      cultivation: { type: Boolean, default: true }
    },
    units: {
      temperature: { type: String, enum: ['celsius', 'fahrenheit'], default: 'celsius' },
      area: { type: String, enum: ['acres', 'hectares'], default: 'acres' }
    }
  },
  profile: {
    avatar: String,
    phone: String,
    experience: Number, // years of farming experience
    education: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    expiresAt: Date,
    features: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);