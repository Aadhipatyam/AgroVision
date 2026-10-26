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
const assistantRoutes = require('./routes/assistant');

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed frontend origins.
// Set FRONTEND_URL in .env (comma-separated for several), e.g.
// FRONTEND_URL=http://localhost:5173,http://localhost:5174
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim());

// Security & middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // allow tools like Postman/PowerShell (no origin) and listed frontends
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (general)
const isProd = process.env.NODE_ENV === 'production';
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 500,     // looser while developing
  message: { success: false, message: 'Too many requests, try again later.' }
}));

// Stricter limit for the AI assistant (every question costs a Gemini call)
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,                      // 10 questions per minute per IP
  message: { success: false, message: 'Too many questions. Please wait a minute.' }
});

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
app.use('/api/assistant', assistantLimiter, assistantRoutes);

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

// 404 (must come after all routes)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler (must be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});