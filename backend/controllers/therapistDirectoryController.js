const db = require('../config/db');
const { computeNextAvailableSlot } = require('./availabilityController');

// Feature 4 (Person 3 / Sprint 1): Therapist Directory — browse/filter
// list of active, verified therapists with real dynamic availability previews.
const getTherapistDirectory = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT u.id, COALESCE(u.display_name, u.name) AS name, 
                    COALESCE(tp.profile_photo_url, u.profile_photo) AS profile_photo_url, 
                    tp.biography, tp.specialties, tp.languages, 
                    COALESCE(tp.consultation_fee, 1500) AS consultation_fee, 
                    COALESCE(tp.session_type, 'both') AS session_type, 
                    u.gender, tp.qualification, tp.hospital_name
             FROM users u
             LEFT JOIN therapist_profiles tp ON tp.user_id = u.id
             WHERE u.role = 'therapist'
             ORDER BY name ASC`
        );

        const toList = (str) => (str || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        const sessionTypeToFormats = (sessionType) => {
            if (sessionType === 'online') return ['Online Video'];
            if (sessionType === 'in-person') return ['In-Person'];
            return ['Online Video', 'In-Person'];
        };

        const now = new Date();
        const therapists = await Promise.all(rows.map(async (t) => {
            const nextSlot = await computeNextAvailableSlot(t.id, now);
            const fee = t.consultation_fee ? Number(t.consultation_fee) : 1500;
            return {
                id: t.id,
                name: t.name,
                profile_photo_url: t.profile_photo_url || '',
                biography: t.biography || 'Professional therapist dedicated to supportive, evidence-based mental health care.',
                bio: t.biography || 'Professional therapist dedicated to supportive, evidence-based mental health care.',
                specialties: toList(t.specialties),
                languages: toList(t.languages).length > 0 ? toList(t.languages) : ['English', 'Bengali'],
                formats: sessionTypeToFormats(t.session_type),
                consultation_fee: fee > 0 ? fee : 1500,
                session_type: t.session_type || 'both',
                gender: t.gender || '',
                qualification: t.qualification || '',
                hospital_name: t.hospital_name || '',
                next_available_slot: nextSlot
            };
        }));

        return res.status(200).json(therapists);
    } catch (err) {
        console.error('Error fetching therapist directory:', err);
        return res.status(500).json({
            message: 'A database error occurred while loading the therapist directory.'
        });
    }
};

module.exports = { getTherapistDirectory };
