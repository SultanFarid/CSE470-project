const SessionModel = require('../models/sessionModel');
const NotificationModel = require('../models/notificationModel');
const UserModel = require('../models/userModel');
const TherapistProfileModel = require('../models/therapistProfileModel');

// Runs when a logged-in patient books a session with a therapist.
// After creating the session, it automatically notifies the therapist —
// this is the "Trigger 1" part of Feature 19.
const bookSession = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const { therapistId } = req.body;

        if (!patientId) {
            return res.status(401).json({ message: 'Unauthorized. Please log in again.' });
        }
        if (!therapistId) {
            return res.status(400).json({ message: 'therapistId is required.' });
        }

        // 1. Create the session record, locking in the therapist's current fee
        //    so later fee changes don't rewrite historical earnings.
        const therapistProfile = await TherapistProfileModel.findByUserId(therapistId);
        const fee = therapistProfile?.consultation_fee ?? null;
        const sessionId = await SessionModel.createSession(patientId, therapistId, fee);

        // 2. Look up the patient's name for a friendly notification message
        const patient = await UserModel.findById(patientId);
        const patientName = patient?.display_name || 'A patient';

        // 3. Automatically notify the therapist
        await NotificationModel.createNotification(
            therapistId,
            `${patientName} has booked a session with you.`,
            'booking_alert'
        );

        res.status(201).json({
            message: 'Session booked successfully',
            sessionId
        });
    } catch (err) {
        console.error('Book session error:', err);
        res.status(500).json({ message: 'Server error while booking session.' });
    }
};

const myPatientSessions = async (req, res) => {
    try {
        const sessions = await SessionModel.getSessionsByPatient(req.user.id);
        res.status(200).json(sessions);
    } catch (err) {
        console.error('Get patient sessions error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const myTherapistSessions = async (req, res) => {
    try {
        const sessions = await SessionModel.getSessionsByTherapist(req.user.id);
        res.status(200).json(sessions);
    } catch (err) {
        console.error('Get therapist sessions error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateSessionStatus = async (req, res) => {
    try {
        const therapistId = req.user?.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'status is required.' });
        }

        const affected = await SessionModel.updateStatus(id, therapistId, status);
        if (affected === 0) {
            return res.status(404).json({ message: 'Session not found or you do not own this session.' });
        }

        // If a session just wrapped up, let the patient know their care plan may be updated.
        if (status === 'completed') {
            const session = await SessionModel.getById(id);
            if (session) {
                await NotificationModel.createNotification(
                    session.patient_id,
                    'Your session has been marked complete. Check for any new notes or exercises from your therapist.',
                    'session_update'
                );
            }
        }

        res.status(200).json({ message: 'Session status updated.' });
    } catch (err) {
        if (err.message === 'Invalid status value.') {
            return res.status(400).json({ message: err.message });
        }
        console.error('Update session status error:', err);
        res.status(500).json({ message: 'Server error while updating session status.' });
    }
};

module.exports = { bookSession, myPatientSessions, myTherapistSessions, updateSessionStatus };