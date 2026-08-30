const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const upload = require('../middleware/uploadMiddleware');
const verifyToken = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, patientController.getPatientProfile);
router.put('/profile', verifyToken, patientController.updatePatientProfile);
router.post('/upload-photo', verifyToken, upload.single('photo'), patientController.uploadPatientPhoto);

// Feature 5: Appointment Booking System Routes
router.get('/appointments', verifyToken, patientController.getAppointments);
router.post('/appointments/book', verifyToken, patientController.bookAppointment);
router.put('/appointments/:id/cancel', verifyToken, patientController.cancelAppointment);
router.get('/therapist-slots', verifyToken, patientController.getTherapistSlots);

// Feature 6b: Streak & task completion
router.get('/streak', verifyToken, patientController.getStreak);
router.post('/tasks/:id/complete', verifyToken, patientController.completeTask);

router.post("/matchmaker", verifyToken, require("../controllers/matchmakerController").runMatchmaker);

module.exports = router;