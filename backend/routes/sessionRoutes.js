const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const controller = require('../controllers/sessionController');

router.post('/book', verifyToken, controller.bookSession);
router.get('/my-sessions/patient', verifyToken, controller.myPatientSessions);
router.get('/my-sessions/therapist', verifyToken, controller.myTherapistSessions);

module.exports = router;