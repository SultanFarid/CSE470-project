const db = require('../config/db');

// Feature 2 (Vitals Check) writes here so Feature 11 (Pre-Session Briefings)
// has something to summarize. We keep every submission (history) rather than
// overwriting — getLatestByPatient always reads the newest row.
const saveVitals = async (patientId, data) => {
    const detailedIntakeJson = data.detailedIntake ? JSON.stringify(data.detailedIntake) : null;
    const [result] = await db.query(
        `INSERT INTO patient_vitals
            (patient_id, concerns, duration, severity, gender_pref, language_pref, format_pref, notes, detailed_intake)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            patientId,
            JSON.stringify(Array.isArray(data.concerns) ? data.concerns : []),
            data.duration || '',
            data.severity || '',
            data.genderPref || '',
            data.languagePref || '',
            data.formatPref || '',
            data.notes || '',
            detailedIntakeJson
        ]
    );
    return result.insertId;
};

const getLatestByPatient = async (patientId) => {
    const [rows] = await db.query(
        `SELECT * FROM patient_vitals WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1`,
        [patientId]
    );
    if (!rows[0]) return null;
    return {
        ...rows[0],
        concerns: safeParseArray(rows[0].concerns),
        detailed_intake: safeParseObject(rows[0].detailed_intake)
    };
};

const safeParseArray = (raw) => {
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return [];
    }
};

const safeParseObject = (raw) => {
    if (!raw) return null;
    try {
        const parsed = typeof raw === 'object' ? raw : JSON.parse(raw);
        return parsed || null;
    } catch (err) {
        return null;
    }
};

module.exports = { saveVitals, getLatestByPatient };
