const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const adminUserController = require('../controllers/adminUserController');

router.get('/users', verifyToken, isAdmin, adminUserController.getAllUsers);
router.get('/users/:id', verifyToken, isAdmin, adminUserController.getUserDetails);
router.put('/users/:id/suspend', verifyToken, isAdmin, adminUserController.suspendUser);
router.put('/users/:id/deactivate', verifyToken, isAdmin, adminUserController.deactivateUser);
router.put('/users/:id/reactivate', verifyToken, isAdmin, adminUserController.reactivateUser);

module.exports = router;