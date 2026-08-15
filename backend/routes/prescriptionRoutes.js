const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist } = require('../middleware/authMiddleware');
const controller = require('../controllers/prescriptionController');

router.post('/save', verifyToken, isTherapist, controller.savePrescription);
router.get('/session/:sessionId', verifyToken, isTherapist, controller.getPrescriptionForSession);

module.exports = router;
