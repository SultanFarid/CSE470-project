const express = require('express');
const router = express.Router();
const { verifyToken, isPatient } = require('../middleware/authMiddleware');
const controller = require('../controllers/vitalsController');

router.post('/save', verifyToken, isPatient, controller.saveVitals);

module.exports = router;
