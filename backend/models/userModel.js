const db = require('../config/db');

class UserModel {
    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    // Used by patient self-signup. Role is always passed explicitly by the caller
    // (never taken from client input) so this can't be abused to create therapist/admin accounts.
    static async create(name, email, password, role) {
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, password, role]
        );
        return { id: result.insertId, name, email, role };
    }
}
module.exports = UserModel;