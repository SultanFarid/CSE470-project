const db = require('../config/db');
const TherapistProfileModel = require('../models/therapistProfileModel');


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
const getProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const profile = await TherapistProfileModel.findByUserId(userId);
        if (!profile) {
            return res.status(404).json({ message: 'No profile found for this therapist.' });
        }
        res.status(200).json(profile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Database error fetching profile.' });
    }
};

const updateProfile = async (req, res) => {
    const { user_id, profile_photo_url, biography, specialties, languages, consultation_fee, session_type } = req.body;

    if (!user_id) {
        return res.status(400).json({ message: 'user_id is required.' });
    }

    const allowedSessionTypes = ['online', 'in-person', 'both'];
    if (session_type && !allowedSessionTypes.includes(session_type)) {
        return res.status(400).json({ message: 'Invalid session type.' });
    }

    try {
        await TherapistProfileModel.upsert(user_id, {
            profile_photo_url,
            biography,
            specialties,
            languages,
            consultation_fee: parseFloat(consultation_fee) || 0,
            session_type
        });
        res.status(200).json({ message: 'Profile updated successfully!' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Database error updating profile.' });
    }
};

const uploadProfilePhoto = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No photo file was uploaded.' });
    }
    const fileUrl = `/uploads/profile_photos/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
};

module.exports = { getApplicationSettings, submitApplication, updateProfile, getProfile, uploadProfilePhoto };
