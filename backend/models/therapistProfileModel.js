const db = require('../config/db');

class TherapistProfileModel {
    static async findByUserId(userId) {
        const [rows] = await db.execute(
            'SELECT * FROM therapist_profiles WHERE user_id = ?',
            [userId]
        );
        return rows[0];
    }

    static async getAllFormatted() {
        const [rows] = await db.execute(
            `SELECT u.id, u.name, tp.profile_photo_url, tp.biography, tp.specialties,
                    tp.languages, tp.consultation_fee, tp.session_type, u.gender
             FROM users u
             JOIN therapist_profiles tp ON tp.user_id = u.id
             WHERE u.role = 'therapist'
             ORDER BY u.name ASC`
        );
        const toList = (str) => (str || '').split(',').map(s => s.trim()).filter(Boolean);
        const sessionTypeToFormats = (sessionType) => {
            if (sessionType === 'online') return ['Online Video'];
            if (sessionType === 'in-person') return ['In-Person'];
            return ['Online Video', 'In-Person'];
        };
        return rows.map((t) => ({
            id: t.id,
            name: t.name,
            profile_photo_url: t.profile_photo_url || '',
            biography: t.biography || '',
            bio: t.biography || '',
            specialties: toList(t.specialties),
            languages: toList(t.languages),
            formats: sessionTypeToFormats(t.session_type),
            gender: t.gender || 'Not specified',
            consultation_fee: Number(t.consultation_fee) || 0,
            session_type: t.session_type || 'both'
        }));
    }

    static async upsert(userId, data) {
        const query = `
            INSERT INTO therapist_profiles
                (user_id, profile_photo_url, biography, specialties, languages, consultation_fee, session_type, hospital_name, qualification)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                profile_photo_url = VALUES(profile_photo_url),
                biography = VALUES(biography),
                specialties = VALUES(specialties),
                languages = VALUES(languages),
                consultation_fee = VALUES(consultation_fee),
                session_type = VALUES(session_type),
                hospital_name = VALUES(hospital_name),
                qualification = VALUES(qualification)
        `;
        const values = [
            userId,
            data.profile_photo_url || '',
            data.biography || '',
            data.specialties || '',
            data.languages || '',
            data.consultation_fee || 0,
            data.session_type || 'both',
            data.hospital_name || '',
            data.qualification || ''
        ];
        const [result] = await db.execute(query, values);
        return result;
    }
}

module.exports = TherapistProfileModel;