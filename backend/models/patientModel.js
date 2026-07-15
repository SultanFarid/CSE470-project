const db = require('../config/db'); 

const PatientModel = {

    findByUserId: async (userId) => {
        const query = `
            SELECT u.id, u.name, u.email, p.profile_photo_url, p.contact_number, p.location, p.preferred_language 
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
        const query = "UPDATE users SET name = ? WHERE id = ?";
        const [result] = await db.query(query, [name, userId]);
        return result;
    }
};

module.exports = PatientModel;