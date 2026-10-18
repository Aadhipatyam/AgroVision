// routes/dbTest.js
const express = require('express');
const Test = require('../models/Test');
const router = express.Router();

// POST /api/db-test
router.post('/', async (req, res) => {
  try {
    const testEntry = new Test({ message: 'MongoDB Atlas is connected ✅' });
    const saved = await testEntry.save();
    res.status(200).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: 'MongoDB test failed', error: err.message });
  }
});

module.exports = router;
