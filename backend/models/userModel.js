const db = require('../config/db');

class UserModel {
    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async create({ name, email, password, role }) {
        const [result] = await db.execute(
            'INSERT INTO users (display_name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role, 'active']
        );
        return { id: result.insertId, name, email, role };
    }

    static async updateLastLogin(userId) {
        await db.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [userId]
        );
    }
}
module.exports = UserModel;