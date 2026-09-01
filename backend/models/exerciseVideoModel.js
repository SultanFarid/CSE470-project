const db = require('../config/db');

// Search and retrieve curated therapeutic exercise videos from database
const search = async (query = '', limit = 20) => {
    const trimmed = (query || '').trim();
    if (!trimmed) {
        const [rows] = await db.query(
            `SELECT id, title, category, youtube_url, duration_minutes, description, tags
             FROM therapy_exercise_videos
             WHERE is_active = 1
             ORDER BY category ASC, title ASC
             LIMIT ?`,
            [limit]
        );
        return rows;
    }
    const q = `%${trimmed}%`;
    const [rows] = await db.query(
        `SELECT id, title, category, youtube_url, duration_minutes, description, tags
         FROM therapy_exercise_videos
         WHERE is_active = 1 AND (title LIKE ? OR category LIKE ? OR tags LIKE ? OR description LIKE ?)
         ORDER BY 
            CASE 
                WHEN title LIKE ? THEN 1
                WHEN tags LIKE ? THEN 2
                ELSE 3
            END, title ASC
         LIMIT ?`,
        [q, q, q, q, q, q, limit]
    );
    return rows;
};

const getAll = async () => {
    const [rows] = await db.query(
        `SELECT id, title, category, youtube_url, duration_minutes, description, tags
         FROM therapy_exercise_videos
         WHERE is_active = 1
         ORDER BY category ASC, title ASC`
    );
    return rows;
};

module.exports = { search, getAll };
