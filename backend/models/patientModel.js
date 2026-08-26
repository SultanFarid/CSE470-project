const db = require('../config/db'); 

const PatientModel = {

    findByUserId: async (userId) => {
        const query = `
            SELECT u.id, u.display_name AS name, u.email, p.profile_photo_url, p.contact_number, p.location, p.preferred_language 
            FROM users u
            LEFT JOIN patient_profiles p ON u.id = p.user_id
            WHERE u.id = ?
        `;

        const [rows] = await db.query(query, [userId]);
        return rows;
    },


    updateProfile: async (userId, profileData) => {
        const { contact_number, location, preferred_language, profile_photo_url } = profileData;
        
        const query = `
            INSERT INTO patient_profiles (user_id, contact_number, location, preferred_language, profile_photo_url)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                contact_number = VALUES(contact_number),
                location = VALUES(location),
                preferred_language = VALUES(preferred_language),
                profile_photo_url = VALUES(profile_photo_url)
        `;
        
        const [result] = await db.query(query, [userId, contact_number, location, preferred_language, profile_photo_url]);
        return result;
    },


    updateName: async (userId, name) => {
        const query = "UPDATE users SET display_name = ? WHERE id = ?";
        const [result] = await db.query(query, [name, userId]);
        return result;
    },

    // Feature 6b: Record that the patient completed at least one task today.
    // Uses INSERT IGNORE so it's safe to call multiple times per day.
    recordTaskCompletion: async (userId) => {
        await db.query(
            `INSERT IGNORE INTO task_completions (patient_id, completed_date)
             VALUES (?, CURDATE())`,
            [userId]
        );
    },

    // Feature 6b: Count consecutive days (ending today) where the patient
    // has at least one recorded completion. Returns 0 if they have none.
    getStreak: async (userId) => {
        // Pull all completion dates descending, then walk backwards in JS
        // to find the first gap — safe and index-friendly even for large sets.
        const [rows] = await db.query(
            `SELECT completed_date FROM task_completions
             WHERE patient_id = ?
             ORDER BY completed_date DESC`,
            [userId]
        );
        if (rows.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let streak = 0;
        let expected = new Date(today);

        for (const row of rows) {
            const d = new Date(row.completed_date);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() === expected.getTime()) {
                streak++;
                expected.setDate(expected.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }
};

module.exports = PatientModel;