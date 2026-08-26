const express = require('express');
const router = express.Router();
const { getTherapistDirectory } = require('../controllers/therapistDirectoryController');
const verifyToken = require('../middleware/authMiddleware');

// Mounted at /api/patient alongside patientRoutes.js so it matches the
// path the frontend (api.js) already calls: /api/patient/therapist-directory
// This file is separate from patientRoutes.js on purpose — Feature 4 is
// owned by Person 3, patientRoutes.js is owned by teammates.
router.get('/therapist-directory', verifyToken, getTherapistDirectory);

module.exports = router;
