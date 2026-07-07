const db = require('../config/db');

// Fetch the application deadline for the frontend
const getApplicationSettings = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'application_deadline'");
        if (rows.length > 0) {
            res.status(200).json({ deadline: rows[0].setting_value });
        } else {
            res.status(404).json({ message: 'Deadline not set' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Database error fetching settings.' });
    }
};

// Handle massive application payload
const submitApplication = async (req, res) => {
    const data = req.body;
    
    try {
        // Stringify JSON arrays for the database
        const empHistory = JSON.stringify(data.employment_history || []);
        const refs = JSON.stringify(data.professional_references || []);

        const query = `
            INSERT INTO therapist_applications 
            (name, email, address, phone, national_id, emergency_contact, position_applied, employment_type, shift_availability, start_date, desired_salary, primary_license, npi, basic_certs, specialty_certs, education_history, employment_history, emr_experience, languages, therapeutic_modalities, malpractice_history, license_suspension, criminal_record, oig_exclusion, immunization_proof, physical_capability, professional_references, truthfulness_attestation) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            data.name, data.email, data.address, data.phone, data.national_id, data.emergency_contact, 
            data.position_applied, data.employment_type, data.shift_availability, data.start_date, data.desired_salary || 0, 
            data.primary_license, data.npi, data.basic_certs, data.specialty_certs, data.education_history, empHistory, 
            data.emr_experience, data.languages, data.therapeutic_modalities, data.malpractice_history, 
            data.license_suspension ? 1 : 0, data.criminal_record ? 1 : 0, data.oig_exclusion ? 1 : 0, 
            data.immunization_proof ? 1 : 0, data.physical_capability ? 1 : 0, refs, 
            data.truthfulness_attestation ? 1 : 0
        ];

        await db.execute(query, values);
        res.status(201).json({ message: 'Application submitted successfully! Awaiting Admin approval.' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'An application with this email already exists.' });
        res.status(500).json({ message: 'Database error processing application.' });
    }
};

// ... keep your existing updateProfile function ...
const updateProfile = async (req, res) => { /* existing code */ };

module.exports = { getApplicationSettings, submitApplication, updateProfile };