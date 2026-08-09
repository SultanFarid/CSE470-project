const AdminVerificationModel = require('../models/adminVerificationModel');
const AdminUserModel = require('../models/adminUserModel'); 

const listApplications = async (req, res) => {
    try {
        const { status } = req.query;
        const applications = await AdminVerificationModel.getAllApplications(status);
        res.status(200).json(applications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getApplicationDetails = async (req, res) => {
    try {
        const application = await AdminVerificationModel.getApplicationById(req.params.id);
        if (!application) return res.status(404).json({ message: 'Not found' });
        res.status(200).json(application);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const approveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await AdminVerificationModel.getApplicationById(id);

        
        await AdminVerificationModel.updateApplicationStatus(id, 'approved', req.user.id);


        await AdminVerificationModel.upgradeUserToTherapist(application.user_id);

    
        await AdminUserModel.createNotification(
            application.user_id,
            'Congratulations! Your therapist application has been approved. You now have access to your therapist dashboard.'
        );

        res.status(200).json({ message: 'Application approved and account upgraded' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await AdminVerificationModel.getApplicationById(id);

        await AdminVerificationModel.updateApplicationStatus(id, 'rejected', req.user.id);

        await AdminUserModel.createNotification(
            application.user_id,
            'Your therapist application has been reviewed and was not approved at this time.'
        );

        res.status(200).json({ message: 'Application rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const scheduleViva = async (req, res) => {
    try {
        const { id } = req.params;
        const { vivaDate, notes } = req.body;
        await AdminVerificationModel.scheduleViva(id, vivaDate, notes);
        res.status(200).json({ message: 'Viva scheduled' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { listApplications, getApplicationDetails, approveApplication, rejectApplication, scheduleViva };