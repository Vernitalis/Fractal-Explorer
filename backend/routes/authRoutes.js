const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { register, login, profile, deleteUser} = require('../controllers/authController');

// Register new user
router.post('/register', register);

// Login existing user
router.post('/login', login);

// Fetchn user profile
router.get('/profile', protect, profile);

// Delete user by ID
router.delete('/delete', protect, deleteUser);

module.exports = router;
