const VitalsModel = require('../models/vitalsModel');

// POST /api/vitals/save
// Fired when a patient finishes the Vitals Check questionnaire (Feature 2).
// Persisting this is what lets Feature 11 (Pre-Session Briefings) summarize
// it for the therapist later — this endpoint doesn't change the existing
// AI-matchmaker flow, it just also saves a copy.
const saveVitals = async (req, res) => {
    try {
        const patientId = req.user?.id;
        const { concerns, duration, severity, genderPref, languagePref, formatPref, notes } = req.body;

        const vitalsId = await VitalsModel.saveVitals(patientId, {
            concerns, duration, severity, genderPref, languagePref, formatPref, notes
        });

        res.status(201).json({ message: 'Vitals saved.', vitalsId });
    } catch (err) {
        console.error('Save vitals error:', err);
        res.status(500).json({ message: 'Server error while saving vitals.' });
    }
};

module.exports = { saveVitals };
