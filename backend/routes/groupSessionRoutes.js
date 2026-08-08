const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isTherapist, isPatient } = require('../middleware/authMiddleware');
const controller = require('../controllers/groupSessionController');

// ===== Therapist routes =====
router.post('/propose', verifyToken, isTherapist, controller.proposeSession);
router.get('/my-proposals', verifyToken, isTherapist, controller.myProposals);
router.get('/:id/enrolled', verifyToken, isTherapist, controller.enrolledPatients);
router.put('/enrollment/:enrollmentId/attendance', verifyToken, isTherapist, controller.markAttendance);
router.put('/:id/notes', verifyToken, isTherapist, controller.writeNotes);

// ===== Admin routes =====
router.get('/admin/pending', verifyToken, isAdmin, controller.pendingProposals);
router.get('/admin/all', verifyToken, isAdmin, controller.allProposals);
router.put('/admin/:id/approve', verifyToken, isAdmin, controller.approveProposal);
router.put('/admin/:id/reject', verifyToken, isAdmin, controller.rejectProposal);

// ===== Patient routes =====
router.get('/open', verifyToken, isPatient, controller.openSessions);
router.post('/:id/join', verifyToken, isPatient, controller.joinSession);
router.get('/my-enrollments', verifyToken, isPatient, controller.myEnrollments);

module.exports = router;