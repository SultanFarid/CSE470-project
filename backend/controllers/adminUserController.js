const adminUserModel = require('../models/adminUserModel');

const getAllUsers = async (req, res) => {
    try {
        const { search, role } = req.query;
        const results = await adminUserModel.searchUsers(search, role);
        res.status(200).json(results);
    } catch (err) {
        console.error('getAllUsers error:', err);
        res.status(500).json({ 
            message: 'Failed to fetch users', error: err.message 
        });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const results = await adminUserModel.getUserById(id);
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(results[0]);
    } catch (err) {
        console.error('getUserDetails error:', err);
        res.status(500).json({ 
            message: 'Failed to fetch user', error: err.message 
        });
    }
};

const suspendUser = async (req, res) => {
    try {
        const { id } = req.params;
        await adminUserModel.updateUserStatus(id, 'suspended');
        const message = 
            'Your account has been temporarily suspended ' +
            'by the administrator. Please contact support.';
        try {
            await adminUserModel.createNotification(id, message);
        } catch (notifErr) {
            console.error('Notification failed:', notifErr);
        }
        res.status(200).json({ message: 'User suspended successfully' });
    } catch (err) {
        console.error('suspendUser error:', err);
        res.status(500).json({ 
            message: 'Failed to suspend user', error: err.message 
        });
    }
};

const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        await adminUserModel.updateUserStatus(id, 'deactivated');
        const message = 
            'Your account has been permanently deactivated ' +
            'by the administrator.';
        try {
            await adminUserModel.createNotification(id, message);
        } catch (notifErr) {
            console.error('Notification failed:', notifErr);
        }
        res.status(200).json({ message: 'User deactivated successfully' });
    } catch (err) {
        console.error('deactivateUser error:', err);
        res.status(500).json({ 
            message: 'Failed to deactivate user', error: err.message 
        });
    }
};

const reactivateUser = async (req, res) => {
    try {
        const { id } = req.params;
        await adminUserModel.updateUserStatus(id, 'active');
        const message = 
            'Your account has been reactivated. ' +
            'You can now log in again.';
        try {
            await adminUserModel.createNotification(id, message);
        } catch (notifErr) {
            console.error('Notification failed:', notifErr);
        }
        res.status(200).json({ message: 'User reactivated successfully' });
    } catch (err) {
        console.error('reactivateUser error:', err);
        res.status(500).json({ 
            message: 'Failed to reactivate user', error: err.message 
        });
    }
};

module.exports = {
    getAllUsers,
    getUserDetails,
    suspendUser,
    deactivateUser,
    reactivateUser
};