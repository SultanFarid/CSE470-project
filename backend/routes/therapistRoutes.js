const express = require('express');
const router = express.Router();
const { submitApplication, updateProfile, getApplicationSettings } = require('../controllers/therapistController');

router.get('/settings', getApplicationSettings); // New route
router.post('/apply', submitApplication);
router.post('/update-profile', updateProfile);

module.exports = router;