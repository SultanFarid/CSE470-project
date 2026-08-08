const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');
const isAdmin = verifyToken.isAdmin;

const controller = require('../controllers/adminVerificationController');

router.get('/applications', verifyToken, isAdmin, controller.listApplications);
router.get('/applications/:id', verifyToken, isAdmin, controller.getApplicationDetails);
router.put('/applications/:id/approve', verifyToken, isAdmin, controller.approveApplication);
router.put('/applications/:id/reject', verifyToken, isAdmin, controller.rejectApplication);
router.put('/applications/:id/schedule-viva', verifyToken, isAdmin, controller.scheduleViva);

module.exports = router;