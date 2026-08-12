const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { verifyToken } = require('../middleware/authMiddleware');
const { submitApplication, updateProfile, getApplicationSettings, getProfile, uploadProfilePhoto } = require('../controllers/therapistController');
const groupController = require('../controllers/groupSessionController');

router.get('/settings', getApplicationSettings);
router.post('/apply', submitApplication);
router.post('/update-profile', updateProfile);
router.get('/profile/:userId', getProfile);
router.post('/upload-photo', upload.single('photo'), uploadProfilePhoto);

// Group Session routes (Feature 20 — Part A)
router.post('/groups/propose', verifyToken, groupController.proposeSession);
router.get('/groups/my-proposals', verifyToken, groupController.myProposals);

module.exports = router;