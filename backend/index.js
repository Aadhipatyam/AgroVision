// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const weatherRoutes = require('./routes/weather');
const priceRoutes = require('./routes/prices');
const policyRoutes = require('./routes/policies');
const cultivationRoutes = require('./routes/cultivation');
const alertRoutes = require('./routes/alerts');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, try again later.'
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)

.then(() => console.log('✅ MongoDB Atlas connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/cultivation', cultivationRoutes);
app.use('/api/alerts', alertRoutes);

// Dev-only DB connectivity check — never mounted in production, unauthenticated by design for local smoke-testing
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/db-test', require('./routes/dbTest'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AgroVision API is running',
    version: '1.0.0'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
