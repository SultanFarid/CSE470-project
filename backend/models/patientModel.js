const db = require('../config/db'); // This is a Promise-based pool

const PatientModel = {
    // 1. Find a patient profile by their User ID
    findByUserId: async (userId) => {
        const query = `
            SELECT u.id, u.name, u.email, p.profile_photo_url, p.contact_number, p.location, p.preferred_language 
            FROM users u
            LEFT JOIN patient_profiles p ON u.id = p.user_id
            WHERE u.id = ?
        `;
        // Using await because db is a promise pool
        const [rows] = await db.query(query, [userId]);
        return rows;
    },

    // 2. Update or insert patient profile details
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

    // 3. Update the main display name in the users table
    updateName: async (userId, name) => {
        const query = "UPDATE users SET name = ? WHERE id = ?";
        const [result] = await db.query(query, [name, userId]);
        return result;
    }
};

module.exports = PatientModel;