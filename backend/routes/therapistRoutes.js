const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { submitApplication, updateProfile, getApplicationSettings, getProfile, uploadProfilePhoto } = require('../controllers/therapistController');
router.get('/settings', getApplicationSettings);
router.post('/apply', submitApplication);
router.post('/update-profile', updateProfile);
router.get('/profile/:userId', getProfile);
router.post('/upload-photo', upload.single('photo'), uploadProfilePhoto);

module.exports = router;