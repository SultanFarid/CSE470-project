const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// Import verifyToken and isPatient correctly
const { verifyToken, isPatient } = require('../middleware/authMiddleware');

// Add both middlewares
router.get('/profile', verifyToken, isPatient, patientController.getPatientProfile);
router.put('/profile', verifyToken, isPatient, patientController.updatePatientProfile);

module.exports = router;