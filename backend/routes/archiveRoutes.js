const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist } = require('../middleware/authMiddleware');
const controller = require('../controllers/archiveController');

router.get('/patients', verifyToken, isTherapist, controller.searchPatients);
router.get('/patients/:patientId/history', verifyToken, isTherapist, controller.getPatientHistory);

module.exports = router;
