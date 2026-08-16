const db = require('../config/db');

class UserModel {
    // Find a user by email (For Login)
    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    // Find a user by ID
    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    // Create a new user (Parent/School/Admin)
    static async create(userData) {
        const { role, email, password_hash, full_name, phone } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (role, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)',
            [role, email, password_hash, full_name, phone]
        );
        return result.insertId;
    }

    // Get all Parents and Schools
    static async getAllParents() {
        const [rows] = await db.execute(
            `SELECT id, full_name, email, phone, role, created_at 
             FROM users WHERE role IN ('parent', 'school')`
        );
        return rows;
    }
}

module.exports = UserModel;