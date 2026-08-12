const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); // existing middleware অনুযায়ী নাম মেলান
const { getDashboardStats } = require('../controllers/adminAnalyticsController');

router.get('/dashboard', verifyToken, isAdmin, getDashboardStats);

module.exports = router;