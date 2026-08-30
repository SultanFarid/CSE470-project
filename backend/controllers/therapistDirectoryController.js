const db = require('../config/db');
const { computeNextAvailableSlot } = require('./availabilityController');

// Feature 4 (Person 3 / Sprint 1): Therapist Directory — browse/filter
// list of active, verified therapists with real dynamic availability previews.
const getTherapistDirectory = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT u.id, COALESCE(u.display_name, u.name) AS name, tp.profile_photo_url, tp.biography, tp.specialties,
                    tp.languages, tp.consultation_fee, tp.session_type, tp.gender, tp.qualifications
             FROM users u
             JOIN therapist_profiles tp ON tp.user_id = u.id
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
            return {
                id: t.id,
                name: t.name,
                profile_photo_url: t.profile_photo_url || '',
                biography: t.biography || 'Not specified',
                bio: t.biography || 'Not specified',
                specialties: toList(t.specialties),
                languages: toList(t.languages),
                formats: sessionTypeToFormats(t.session_type),
                consultation_fee: t.consultation_fee ? Number(t.consultation_fee) : 0,
                session_type: t.session_type || 'both',
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
