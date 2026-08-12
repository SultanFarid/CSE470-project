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

    static async create(nameOrObj, email, password, role) {
        let n, e, p, r;
        if (typeof nameOrObj === 'object') {
            n = nameOrObj.name || nameOrObj.display_name;
            e = nameOrObj.email;
            p = nameOrObj.password;
            r = nameOrObj.role || 'patient';
        } else {
            n = nameOrObj;
            e = email;
            p = password;
            r = role || 'patient';
        }

        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [n, e, p, r]
        );
        return { id: result.insertId, name: n, email: e, role: r };
    }

    static async updateLastLogin(userId) {
        try {
            await db.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [userId]
            );
        } catch (err) {
            // Ignore if last_login column is not present
        }
    }
}

module.exports = UserModel;