const db = require('../config/db');
const SessionModel = require('./sessionModel');
const VitalsModel = require('./vitalsModel');
const { getClinicalSuggestions } = require('../utils/briefingSummarizer');

// Feature 11: Pre-Session Patient Briefings & AI Clinical Research.
// Given a session the therapist owns, pulls the patient's latest Vitals
// and Detailed Intake, and generates an AI summary + clinical research recommendations.
const getBriefingForSession = async (sessionId, therapistId) => {
    const session = await SessionModel.getById(sessionId);
    if (!session || session.therapist_id !== therapistId) {
        return null;
    }

    const [patientRows] = await db.query(
        `SELECT u.id, u.display_name AS name, pp.location, pp.preferred_language
         FROM users u
         LEFT JOIN patient_profiles pp ON pp.user_id = u.id
         WHERE u.id = ?`,
        [session.patient_id]
    );
    const patient = patientRows[0] || { id: session.patient_id, name: 'Patient' };

    const vitals = await VitalsModel.getLatestByPatient(session.patient_id);
    const clinicalAnalysis = await getClinicalSuggestions(vitals);

    return {
        session: {
            id: session.id,
            status: session.status,
            scheduled_date: session.scheduled_date,
            time_slot: session.time_slot,
            session_type: session.session_type
        },
        patient,
        vitals,
        summary: clinicalAnalysis.summary,
        clinical_insights: clinicalAnalysis.clinical_insights || [],
        suggested_exercises: clinicalAnalysis.suggested_exercises || [],
        suggested_medicines: clinicalAnalysis.suggested_medicines || [],
        suggested_tests: clinicalAnalysis.suggested_tests || []
    };
};

module.exports = { getBriefingForSession };
