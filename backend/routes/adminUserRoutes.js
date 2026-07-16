const express = require('express');
const router = express.Router();
const adminUserController =
    require('../controllers/adminUserController');

router.get('/users', adminUserController.getAllUsers);
router.get('/users/:id', adminUserController.getUserDetails);
router.put('/users/:id/suspend',
    adminUserController.suspendUser);
router.put('/users/:id/deactivate',
    adminUserController.deactivateUser);
router.put('/users/:id/reactivate',
    adminUserController.reactivateUser);

module.exports = router;