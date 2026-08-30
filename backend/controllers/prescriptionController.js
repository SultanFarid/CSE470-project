const PrescriptionModel = require('../models/prescriptionModel');
const SessionModel = require('../models/sessionModel');
const NotificationModel = require('../models/notificationModel');
const VitalsModel = require('../models/vitalsModel');
const WalletModel = require('../models/walletModel');
const { buildSummary } = require('../utils/briefingSummarizer');

const VALID_ITEM_TYPES = ['medication', 'exercise'];

// POST /api/prescriptions/save
// Body: {
//   sessionId, sessionNotes, medications, additionalBriefing,
//   carePlanItems: [{ item_type, title, youtube_url }],
//   medicines: [{ medicine_id, medicine_name, dosage, frequency_code, frequency_label, duration_days, instructions }],
//   tests: [{ test_id, test_name, notes }]
// }
const savePrescription = async (req, res) => {
    try {
        const therapistId = req.user?.id;
        const { sessionId, sessionNotes, medications, additionalBriefing, carePlanItems, medicines, tests, followUp } = req.body;

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

        const medicineLines = (Array.isArray(medicines) ? medicines : []).filter((m) => m.medicine_name && m.medicine_name.trim());
        const testLines = (Array.isArray(tests) ? tests : []).filter((t) => t.test_name && t.test_name.trim());

        // Regenerate the pre-session summary server-side rather than trusting
        // whatever the client sent — keeps the "AI-generated" record honest
        // and always in sync with the patient's latest intake at save time.
        const vitals = await VitalsModel.getLatestByPatient(session.patient_id);
        const presessionSummary = await buildSummary(vitals);

        if (followUp?.recommended && !followUp?.date) {
            return res.status(400).json({ message: 'Pick a follow-up date, or uncheck "Recommend a follow-up".' });
        }

        const prescriptionId = await PrescriptionModel.upsertPrescription(
            sessionId, session.patient_id, therapistId,
            { sessionNotes, medications, presessionSummary, additionalBriefing, followUp }
        );
        await Promise.all([
            PrescriptionModel.replaceCarePlanItems(prescriptionId, session.patient_id, therapistId, items),
            PrescriptionModel.replaceMedicines(prescriptionId, medicineLines),
            PrescriptionModel.replaceTests(prescriptionId, testLines)
        ]);

        // Writing a prescription is how a session finishes (Feature 12).
        await SessionModel.updateStatus(sessionId, therapistId, 'completed');

        // Credit the therapist's wallet now that the session is actually
        // done — this is deliberately separate from "estimated earnings"
        // (which counts confirmed-but-not-yet-completed sessions instead).
        // creditForCompletedSession is idempotent per session, so re-saving
        // an already-completed session's prescription won't double-credit.
        await WalletModel.creditForCompletedSession(
            therapistId, sessionId, session.fee, `Session completed on ${new Date().toLocaleDateString()}`
        );

        await NotificationModel.createNotification(
            session.patient_id,
            'Your therapist added a new prescription and care plan for you.',
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

// GET /api/prescriptions/pdf-data/session/:sessionId  (therapist — preview/reprint)
const getPrescriptionPdfDataForTherapist = async (req, res) => {
    try {
        const therapistId = req.user?.id;
        const { sessionId } = req.params;
        const data = await PrescriptionModel.getFullPrescriptionForPdf(sessionId, 'therapist_id', therapistId);
        if (!data) {
            return res.status(404).json({ message: 'No prescription found for this session.' });
        }
        res.status(200).json(data);
    } catch (err) {
        console.error('Get prescription PDF data (therapist) error:', err);
        res.status(500).json({ message: 'Server error fetching prescription.' });
    }
};

// GET /api/prescriptions/patient/session/:sessionId/pdf-data  (patient view)
const getPrescriptionPdfDataForPatient = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const { sessionId } = req.params;
        const data = await PrescriptionModel.getFullPrescriptionForPdf(sessionId, 'patient_id', patientId);
        if (!data) {
            return res.status(404).json({ message: 'No prescription found for this session.' });
        }
        res.status(200).json(data);
    } catch (err) {
        console.error('Get prescription PDF data (patient) error:', err);
        res.status(500).json({ message: 'Server error fetching prescription.' });
    }
};

// GET /api/prescriptions/patient/my  (patient's "My Prescriptions" list)
const getMyPrescriptionsList = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const list = await PrescriptionModel.getPrescriptionsListForPatient(patientId);
        res.status(200).json(list);
    } catch (err) {
        console.error('Get patient prescriptions list error:', err);
        res.status(500).json({ message: 'Server error fetching your prescriptions.' });
    }
};

// GET /api/prescriptions/patient/pending-care-plan
// Returns the newest prescription where care_plan_accepted = 0,
// along with its care plan items — used to show the opt-in prompt card.
const getPendingCarePlan = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const pending = await PrescriptionModel.getPendingCarePlan(patientId);
        res.status(200).json(pending || null);
    } catch (err) {
        console.error('Get pending care plan error:', err);
        res.status(500).json({ message: 'Server error fetching pending care plan.' });
    }
};

// PUT /api/prescriptions/patient/:id/accept-care-plan
// Patient accepts the care plan — sets care_plan_accepted = 1.
const acceptCarePlan = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const prescriptionId = parseInt(req.params.id, 10);
        await PrescriptionModel.acceptCarePlan(prescriptionId, patientId);
        res.status(200).json({ message: 'Care plan accepted.' });
    } catch (err) {
        console.error('Accept care plan error:', err);
        res.status(500).json({ message: 'Server error accepting care plan.' });
    }
};

// GET /api/prescriptions/patient/pending-follow-up
const getPendingFollowUp = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const pending = await PrescriptionModel.getPendingFollowUp(patientId);
        res.status(200).json(pending || null);
    } catch (err) {
        console.error('Get pending follow-up error:', err);
        res.status(500).json({ message: 'Server error fetching pending follow-up.' });
    }
};

// PUT /api/prescriptions/patient/:id/respond-follow-up
// Body: { accept: boolean }
const respondToFollowUp = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const prescriptionId = parseInt(req.params.id, 10);
        const accept = !!req.body.accept;

        const updated = await PrescriptionModel.respondToFollowUp(prescriptionId, patientId, accept);
        if (!updated) {
            return res.status(404).json({ message: 'No pending follow-up found to respond to.' });
        }

        // Feature request: acceptance must be acknowledged to the therapist.
        if (accept) {
            const dateStr = updated.follow_up_date
                ? new Date(updated.follow_up_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'the proposed date';
            await NotificationModel.createNotification(
                updated.therapist_id,
                `Your patient accepted the follow-up session you proposed for ${dateStr}.`,
                'follow_up_accepted'
            );
        }

        res.status(200).json({ message: accept ? 'Follow-up accepted.' : 'Follow-up declined.' });
    } catch (err) {
        console.error('Respond to follow-up error:', err);
        res.status(500).json({ message: 'Server error responding to follow-up.' });
    }
};

module.exports = {
    savePrescription,
    getPrescriptionForSession,
    getPrescriptionPdfDataForTherapist,
    getPrescriptionPdfDataForPatient,
    getMyPrescriptionsList,
    getPendingCarePlan,
    acceptCarePlan,
    getPendingFollowUp,
    respondToFollowUp,
};
