const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['insurance', 'subsidy', 'credit', 'training', 'technology', 'marketing', 'welfare'],
    required: true
  },
  level: {
    type: String,
    enum: ['central', 'state', 'district'],
    required: true
  },
  applicableStates: [String], // Empty array means applicable to all states
  applicableDistricts: [String],
  eligibility: {
    criteria: [String],
    farmSize: {
      min: Number,
      max: Number,
      unit: { type: String, enum: ['acres', 'hectares'], default: 'acres' }
    },
    cropTypes: [String],
    farmerCategory: [String], // small, marginal, large, etc.
    income: {
      min: Number,
      max: Number
    }
  },
  benefits: {
    financial: {
      amount: Number,
      type: { type: String, enum: ['lump_sum', 'installments', 'percentage'] },
      maxAmount: Number
    },
    nonFinancial: [String],
    description: String
  },
  applicationProcess: {
    steps: [String],
    documents: [String],
    onlinePortal: String,
    offlineProcess: String,
    processingTime: String
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    applicationDeadline: Date,
    isOngoing: { type: Boolean, default: false }
  },
  contactInfo: {
    department: String,
    phone: String,
    email: String,
    website: String,
    address: String
  },
  statistics: {
    totalBeneficiaries: Number,
    budgetAllocated: Number,
    budgetUtilized: Number,
    successRate: Number
  },
  updates: [{
    date: { type: Date, default: Date.now },
    title: String,
    description: String,
    type: { type: String, enum: ['amendment', 'extension', 'clarification', 'alert'] }
  }],
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'expired'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient searching and filtering
policySchema.index({ title: 'text', description: 'text', tags: 'text' });
policySchema.index({ category: 1, level: 1 });
policySchema.index({ applicableStates: 1 });
policySchema.index({ 'timeline.applicationDeadline': 1 });
policySchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Policy', policySchema);