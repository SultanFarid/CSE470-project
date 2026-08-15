const PrescriptionModel = require('../models/prescriptionModel');
const SessionModel = require('../models/sessionModel');
const NotificationModel = require('../models/notificationModel');

const VALID_ITEM_TYPES = ['medication', 'exercise'];

// POST /api/prescriptions/save
// Body: { sessionId, sessionNotes, medications, carePlanItems: [{ item_type, title, youtube_url }] }
const savePrescription = async (req, res) => {
    try {
        const therapistId = req.user?.id;
        const { sessionId, sessionNotes, medications, carePlanItems } = req.body;

        if (!sessionId) {
            return res.status(400).json({ message: 'sessionId is required.' });
        }

        const session = await SessionModel.getById(sessionId);
        if (!session || session.therapist_id !== therapistId) {
            return res.status(404).json({ message: 'Session not found or you do not own this session.' });
        }

        const items = Array.isArray(carePlanItems) ? carePlanItems : [];
        for (const item of items) {
            if (!item.title || !item.title.trim()) {
                return res.status(400).json({ message: 'Every care plan item needs a title.' });
            }
            if (!VALID_ITEM_TYPES.includes(item.item_type)) {
                return res.status(400).json({ message: `Invalid item_type: ${item.item_type}` });
            }
        }

        const prescriptionId = await PrescriptionModel.upsertPrescription(
            sessionId, session.patient_id, therapistId, sessionNotes, medications
        );
        await PrescriptionModel.replaceCarePlanItems(prescriptionId, session.patient_id, therapistId, items);

        // Writing a prescription is how a session finishes (Feature 12).
        await SessionModel.updateStatus(sessionId, therapistId, 'completed');

        await NotificationModel.createNotification(
            session.patient_id,
            'Your therapist added session notes and a new care plan for you.',
            'prescription_ready'
        );

        res.status(200).json({ message: 'Prescription saved and session marked complete.', prescriptionId });
    } catch (err) {
        console.error('Save prescription error:', err);
        res.status(500).json({ message: 'Server error while saving prescription.' });
    }
};

// GET /api/prescriptions/session/:sessionId
const getPrescriptionForSession = async (req, res) => {
    try {
        const therapistId = req.user?.id;
        const { sessionId } = req.params;
        const prescription = await PrescriptionModel.getPrescriptionBySession(sessionId, therapistId);
        res.status(200).json(prescription || null);
    } catch (err) {
        console.error('Get prescription error:', err);
        res.status(500).json({ message: 'Server error fetching prescription.' });
    }
};

module.exports = { savePrescription, getPrescriptionForSession };
