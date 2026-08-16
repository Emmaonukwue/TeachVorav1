const db = require('../config/db');

class TeacherModel {
    // Get all teachers (with optional status filter)
    static async getAll(status = null) {
        try {
            console.log("--- DEBUG: TeacherModel.getAll() called ---");
            let sql = `
                SELECT u.id as user_id, u.full_name, u.email, u.phone, 
                       tp.qualifications, tp.subjects, tp.status
                FROM users u
                JOIN teacher_profiles tp ON u.id = tp.user_id
            `;
            let params = [];
            if (status) {
                sql += ` WHERE tp.status = ?`;
                params.push(status);
            }
            console.log("DEBUG SQL:", sql);
            console.log("DEBUG Params:", params);
            
            const [rows] = await db.execute(sql, params);
            console.log("DEBUG: TeacherModel.getAll() found", rows.length, "teachers");
            return rows;
        } catch (err) {
            console.error("ERROR in TeacherModel.getAll():", err.message);
            return []; // Always return an empty array on error so the dashboard doesn't crash
        }
    }

    // Get pending teachers
    static async getPending() {
        try {
            const [rows] = await db.execute(`
                SELECT u.id as user_id, u.full_name, u.email, u.phone, 
                       tp.qualifications, tp.subjects, tp.cv_path, tp.cert_path
                FROM users u
                JOIN teacher_profiles tp ON u.id = tp.user_id
                WHERE tp.status = 'pending'
            `);
            return rows;
        } catch (err) {
            console.error("ERROR in TeacherModel.getPending():", err.message);
            return [];
        }
    }

    // Get profile by user_id
    static async findByUserId(userId) {
        try {
            const [rows] = await db.execute('SELECT * FROM teacher_profiles WHERE user_id = ?', [userId]);
            return rows[0];
        } catch (err) {
            console.error("ERROR in TeacherModel.findByUserId():", err.message);
            return null;
        }
    }

    // Get full profile with User details
    static async getFullProfile(teacherId) {
        try {
            const [rows] = await db.execute(`
                SELECT 
                    u.id as user_id, u.full_name, u.email, u.phone,
                    tp.qualifications, tp.experience, tp.subjects, 
                    tp.class_levels, tp.curriculum, tp.teaching_mode, 
                    tp.state_area, tp.expected_rate, tp.availability, 
                    tp.cv_path, tp.cert_path, tp.id_path, tp.status
                FROM users u
                JOIN teacher_profiles tp ON u.id = tp.user_id
                WHERE u.id = ?
            `, [teacherId]);
            return rows[0];
        } catch (err) {
            console.error("ERROR in TeacherModel.getFullProfile():", err.message);
            return null;
        }
    }

    // Create a new teacher profile
    static async createProfile(profileData) {
        const { 
            user_id, qualifications, experience, subjects, class_levels, 
            curriculum, teaching_mode, state_area, expected_rate, 
            availability, cv_path, cert_path, id_path 
        } = profileData;

        const [result] = await db.execute(
            `INSERT INTO teacher_profiles 
            (user_id, qualifications, experience, subjects, class_levels, curriculum, 
             teaching_mode, state_area, expected_rate, availability, cv_path, cert_path, id_path, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [user_id, qualifications, experience, subjects, class_levels, curriculum, 
             teaching_mode, state_area, expected_rate, availability, cv_path, cert_path, id_path]
        );
        return result.insertId;
    }

    // Update status
    static async updateStatus(teacherId, status) {
        await db.execute(
            'UPDATE teacher_profiles SET status = ? WHERE user_id = ?',
            [status, teacherId]
        );
    }
}

module.exports = TeacherModel;
