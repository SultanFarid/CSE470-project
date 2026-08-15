const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const verifyToken = require('../middleware/authMiddleware');
const { isTherapist } = require('../middleware/authMiddleware');

router.post('/submit', verifyToken, reviewController.submitReview);
router.get('/pending', verifyToken, reviewController.getPendingReview);
router.get('/therapist/:therapistId', reviewController.getTherapistSummary);
router.get('/all-summaries', reviewController.getAllTherapistSummaries);
router.get('/my-summary', verifyToken, isTherapist, reviewController.getMySummary);

module.exports = router;
