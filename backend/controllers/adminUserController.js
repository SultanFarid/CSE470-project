const adminUserModel = require('../models/adminUserModel');

const getAllUsers = (req, res) => {
    const { search, role } = req.query;
    adminUserModel.searchUsers(search, role, (err, results) => {
        if (err) return res.status(500).json({ 
            message: 'Failed to fetch users', error: err 
        });
        res.status(200).json(results);
    });
};

const getUserDetails = (req, res) => {
    const { id } = req.params;
    adminUserModel.getUserById(id, (err, results) => {
        if (err) return res.status(500).json({ 
            message: 'Failed to fetch user', error: err 
        });
        if (results.length === 0) return res.status(404).json({ 
            message: 'User not found' 
        });
        res.status(200).json(results[0]);
    });
};

const suspendUser = (req, res) => {
    const { id } = req.params;
    adminUserModel.updateUserStatus(id, 'suspended', (err) => {
        if (err) return res.status(500).json({ 
            message: 'Failed to suspend user', error: err 
        });
        const message = 
            'Your account has been temporarily suspended ' +
            'by the administrator. Please contact support.';
        adminUserModel.createNotification(
            id, message, (notifErr) => {
            if (notifErr) console.error(
                'Notification failed:', notifErr
            );
            res.status(200).json({ 
                message: 'User suspended successfully' 
            });
        });
    });
};

const deactivateUser = (req, res) => {
    const { id } = req.params;
    adminUserModel.updateUserStatus(
        id, 'deactivated', (err) => {
        if (err) return res.status(500).json({ 
            message: 'Failed to deactivate user', error: err 
        });
        const message = 
            'Your account has been permanently deactivated ' +
            'by the administrator.';
        adminUserModel.createNotification(
            id, message, (notifErr) => {
            if (notifErr) console.error(
                'Notification failed:', notifErr
            );
            res.status(200).json({ 
                message: 'User deactivated successfully' 
            });
        });
    });
};

const reactivateUser = (req, res) => {
    const { id } = req.params;
    adminUserModel.updateUserStatus(id, 'active', (err) => {
        if (err) return res.status(500).json({ 
            message: 'Failed to reactivate user', error: err 
        });
        const message = 
            'Your account has been reactivated. ' +
            'You can now log in again.';
        adminUserModel.createNotification(
            id, message, (notifErr) => {
            if (notifErr) console.error(
                'Notification failed:', notifErr
            );
            res.status(200).json({ 
                message: 'User reactivated successfully' 
            });
        });
    });
};

module.exports = {
    getAllUsers,
    getUserDetails,
    suspendUser,
    deactivateUser,
    reactivateUser
};