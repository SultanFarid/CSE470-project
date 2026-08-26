const crypto = require('crypto');
const AdminVerificationModel = require('../models/adminVerificationModel');
const AdminUserModel = require('../models/adminUserModel');
const UserModel = require('../models/userModel');
const SettingsModel = require('../models/settingsModel');

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
        if (!application) return res.status(404).json({ message: 'Not found' });

        await AdminVerificationModel.updateApplicationStatus(id, 'approved', req.user.id);

        let userId = application.user_id;
        let generatedPassword = null;

        if (userId) {
            // Applicant already has an account (e.g. was logged in when applying) — just upgrade it.
            await AdminVerificationModel.upgradeUserToTherapist(userId);
        } else {
            // Public /apply form has no login, so no account exists yet.
            // Reuse an account if this email already has one, otherwise create one now.
            const existing = await UserModel.findByEmail(application.email);
            if (existing) {
                userId = existing.id;
                await AdminVerificationModel.upgradeUserToTherapist(userId);
            } else {
                generatedPassword = crypto.randomBytes(6).toString('hex');
                const created = await UserModel.create({
                    name: application.name,
                    email: application.email,
                    password: generatedPassword,
                    role: 'therapist'
                });
                userId = created.id;
            }
            await AdminVerificationModel.linkUserToApplication(id, userId);
        }

        await AdminUserModel.createNotification(
            userId,
            'Congratulations! Your therapist application has been approved. You now have access to your therapist dashboard.'
        );

        res.status(200).json({
            message: 'Application approved and account upgraded',
            // No email sending is set up in this project yet, so hand the temp
            // credentials back to the admin to pass along manually.
            ...(generatedPassword ? { generatedPassword, accountEmail: application.email } : {})
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const application = await AdminVerificationModel.getApplicationById(id);
        if (!application) return res.status(404).json({ message: 'Not found' });

        await AdminVerificationModel.updateApplicationStatus(id, 'rejected', req.user.id);

        // Public applicants without an account yet have nothing to notify — skip safely.
        if (application.user_id) {
            await AdminUserModel.createNotification(
                application.user_id,
                'Your therapist application has been reviewed and was not approved at this time.'
            );
        }

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

module.exports = {
    listApplications,
    getApplicationDetails,
    approveApplication,
    rejectApplication,
    scheduleViva,
    getSettings,
    saveSettings,
};

// ─── System Settings (Application Deadline) ──────────────────────────────────

async function getSettings(req, res) {
    try {
        const deadline = await SettingsModel.getDeadline();
        res.status(200).json({ deadline });
    } catch (err) {
        console.error('Get settings error:', err);
        res.status(500).json({ message: 'Server error fetching settings.' });
    }
}

async function saveSettings(req, res) {
    try {
        const { date, time, isActive } = req.body;
        await SettingsModel.saveDeadline({ date, time, isActive });
        res.status(200).json({ message: 'Settings saved.' });
    } catch (err) {
        console.error('Save settings error:', err);
        res.status(500).json({ message: 'Server error saving settings.' });
    }
}