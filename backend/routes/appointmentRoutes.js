const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, appointmentController.getAppointments);
router.post('/book', verifyToken, appointmentController.bookAppointment);
router.put('/:id/cancel', verifyToken, appointmentController.cancelAppointment);
router.get('/therapist-slots', verifyToken, appointmentController.getTherapistSlots);

module.exports = router;
