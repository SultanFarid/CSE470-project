const db = require('../config/db');

// Search-as-you-type lookup for the Prescription Builder's medicine picker.
// Matches on brand name or generic name so "sertraline" and "zoloft"-style
// searches both work against the seeded catalog.
const search = async (query, limit = 15) => {
    const q = `%${(query || '').trim()}%`;
    const [rows] = await db.query(
        `SELECT id, name, generic_name, category, common_strength
         FROM medicines
         WHERE is_active = 1 AND (name LIKE ? OR generic_name LIKE ?)
         ORDER BY name ASC
         LIMIT ?`,
        [q, q, limit]
    );
    return rows;
};

module.exports = { search };
