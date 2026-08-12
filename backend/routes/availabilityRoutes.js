const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist } = require('../middleware/authMiddleware');
const {
    getMySchedule,
    saveMySchedule,
    getMyExceptions,
    addMyException,
    deleteMyException,
    getEffectiveAvailability
} = require('../controllers/availabilityController');

// Therapist: manage own weekly recurring schedule
router.get('/schedule', verifyToken, isTherapist, getMySchedule);
router.put('/schedule', verifyToken, isTherapist, saveMySchedule);

// Therapist: manage date-specific exceptions (vacation days, custom hours)
router.get('/exceptions', verifyToken, isTherapist, getMyExceptions);
router.post('/exceptions', verifyToken, isTherapist, addMyException);
router.delete('/exceptions/:id', verifyToken, isTherapist, deleteMyException);

// Public/patient-facing: merged effective availability for a date range
// (base schedule + exceptions applied — booking will subtract taken slots later)
router.get('/:therapistId/effective', getEffectiveAvailability);

module.exports = router;
