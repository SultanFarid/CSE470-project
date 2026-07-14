const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// 1. Import your newly created authentication middleware
const verifyToken = require('../middleware/authMiddleware');

// 2. Add 'verifyToken' right before the controller actions to protect them
router.get('/profile', verifyToken, patientController.getPatientProfile);
router.put('/profile', verifyToken, patientController.updatePatientProfile);

module.exports = router;