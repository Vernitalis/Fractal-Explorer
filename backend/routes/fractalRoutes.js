const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { saveFractal, getUserFractals, deleteFractal } = require('../controllers/fractalController');

// Save a fractal setting
router.post('/save', protect, saveFractal);

// Get saved fractals for logged-in user
router.get('/user', protect, getUserFractals);

// Delete a saved fractal
router.delete('/:id', protect, deleteFractal);

module.exports = router;
