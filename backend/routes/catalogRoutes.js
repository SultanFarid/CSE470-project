const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist } = require('../middleware/authMiddleware');
const controller = require('../controllers/catalogController');

router.get('/medicines/search', verifyToken, isTherapist, controller.searchMedicines);
router.get('/tests/search', verifyToken, isTherapist, controller.searchTests);
router.get('/exercises/search', verifyToken, isTherapist, controller.searchExercises);

module.exports = router;
