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
        const [rows] = await db.query(
            `SELECT DATE_FORMAT(completed_date, '%Y-%m-%d') AS comp_date FROM task_completions
             WHERE patient_id = ?
             ORDER BY comp_date DESC`,
            [userId]
        );
        if (!rows || rows.length === 0) return 0;

        const toDateKey = (dt) => {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const d = String(dt.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const todayKey = toDateKey(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = toDateKey(yesterday);

        const datesSet = new Set(rows.map(r => r.comp_date));

        // Streak is preserved if tasks completed today or yesterday
        let cursor = new Date();
        if (!datesSet.has(todayKey)) {
            if (datesSet.has(yesterdayKey)) {
                cursor = yesterday;
            } else {
                return 0;
            }
        }

        let streak = 0;
        while (datesSet.has(toDateKey(cursor))) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    }
};

module.exports = PatientModel;