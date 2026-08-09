const SessionModel = require('../models/sessionModel');
const NotificationModel = require('../models/notificationModel');
const UserModel = require('../models/userModel');

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

        // 1. Create the session record
        const sessionId = await SessionModel.createSession(patientId, therapistId);

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

module.exports = { bookSession, myPatientSessions, myTherapistSessions };