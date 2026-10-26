// routes/assistant.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || '';

if (!AI_SERVICE_SECRET) {
  console.warn('⚠️  AI_SERVICE_SECRET is not set: the AI service is not protected');
}

// The route is behind `auth`, so every request carries a login token.
// Each login gets its own limit bucket.
const whoKey = (req) => req.get('authorization') || 'anonymous';

const perMinute = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: whoKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many questions. Please wait a minute.' },
});

const perDay = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 150,
  keyGenerator: whoKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Daily question limit reached. Please try again tomorrow.' },
});

router.post('/ask', auth, perMinute, perDay, async (req, res) => {
  const { question, region } = req.body || {};

  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ message: 'Question is required' });
  }
  if (question.length > 500) {
    return res.status(400).json({ message: 'Question is too long (500 characters at most)' });
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AI_SERVICE_SECRET ? { 'x-service-key': AI_SERVICE_SECRET } : {}),
      },
      body: JSON.stringify({
        question: question.trim(),
        region: typeof region === 'string' ? region.trim().slice(0, 100) : '',
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      console.error('AI service returned', response.status);
      return res.status(502).json({ message: 'Assistant is unavailable right now' });
    }

    const data = await response.json();
    res.json({
      answer: data.answer,
      mode: data.mode || 'general',
      sources: data.sources || [],
      links: Array.isArray(data.links) ? data.links : [],
    });
  } catch (err) {
    console.error('AI service error:', err.message);
    res.status(502).json({ message: 'Assistant is unavailable right now' });
  }
});

module.exports = router;