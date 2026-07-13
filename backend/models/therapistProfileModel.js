const db = require('../config/db');

class TherapistProfileModel {
    static async findByUserId(userId) {
        const [rows] = await db.execute(
            'SELECT * FROM therapist_profiles WHERE user_id = ?',
            [userId]
        );
        return rows[0];
    }

    static async upsert(userId, data) {
        const query = `
            INSERT INTO therapist_profiles
                (user_id, profile_photo_url, biography, specialties, languages, consultation_fee, session_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                profile_photo_url = VALUES(profile_photo_url),
                biography = VALUES(biography),
                specialties = VALUES(specialties),
                languages = VALUES(languages),
                consultation_fee = VALUES(consultation_fee),
                session_type = VALUES(session_type)
        `;
        const values = [
            userId,
            data.profile_photo_url || '',
            data.biography || '',
            data.specialties || '',
            data.languages || '',
            data.consultation_fee || 0,
            data.session_type || 'both'
        ];
        const [result] = await db.execute(query, values);
        return result;
    }
}

module.exports = TherapistProfileModel;