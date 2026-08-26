const db = require('../config/db');

// Search-as-you-type lookup for the Prescription Builder's test picker.
const search = async (query, limit = 15) => {
    const q = `%${(query || '').trim()}%`;
    const [rows] = await db.query(
        `SELECT id, name, category, description
         FROM medical_tests
         WHERE is_active = 1 AND (name LIKE ? OR category LIKE ?)
         ORDER BY name ASC
         LIMIT ?`,
        [q, q, limit]
    );
    return rows;
};

module.exports = { search };
