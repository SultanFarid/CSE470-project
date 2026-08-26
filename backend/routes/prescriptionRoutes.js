const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist, isPatient } = require('../middleware/authMiddleware');
const controller = require('../controllers/prescriptionController');

// --- Therapist: Prescription Studio (Feature 12) ---
router.post('/save', verifyToken, isTherapist, controller.savePrescription);
router.get('/session/:sessionId', verifyToken, isTherapist, controller.getPrescriptionForSession);
router.get('/pdf-data/session/:sessionId', verifyToken, isTherapist, controller.getPrescriptionPdfDataForTherapist);

// --- Patient: view/download their own prescriptions ---
router.get('/patient/my', verifyToken, isPatient, controller.getMyPrescriptionsList);
router.get('/patient/session/:sessionId/pdf-data', verifyToken, isPatient, controller.getPrescriptionPdfDataForPatient);

// --- Patient: Feature 6 care plan opt-in prompt ---
router.get('/patient/pending-care-plan', verifyToken, isPatient, controller.getPendingCarePlan);
router.put('/patient/:id/accept-care-plan', verifyToken, isPatient, controller.acceptCarePlan);

module.exports = router;
