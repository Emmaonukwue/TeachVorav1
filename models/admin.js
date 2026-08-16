const db = require('../config/db');

class AdminModel {
    // Fetch Dashboard Statistics
    static async getStats() {
        const [rows] = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
                (SELECT COUNT(*) FROM teacher_profiles WHERE status = 'verified') as verified_teachers,
                (SELECT COUNT(*) FROM teacher_profiles WHERE status = 'pending') as pending_teachers,
                (SELECT COUNT(*) FROM jobs WHERE status = 'published') as active_jobs,
                (SELECT COUNT(*) FROM jobs WHERE status = 'pending_review') as pending_requests
        `);
        return rows[0];
    }

    // Fetch Pending Teachers
    static async getPendingTeachers() {
        const [rows] = await db.execute(`
            SELECT u.id as user_id, u.full_name, u.email, u.phone, 
                   tp.qualifications, tp.subjects, tp.cv_path, tp.cert_path
            FROM users u
            JOIN teacher_profiles tp ON u.id = tp.user_id
            WHERE tp.status = 'pending'
        `);
        return rows;
    }

    // Fetch Pending Jobs
    static async getPendingJobs() {
        const [rows] = await db.execute(`
            SELECT id, subject, class_level, location, teaching_mode, curriculum
            FROM jobs
            WHERE status = 'pending_review'
        `);
        return rows;
    }

    // Fetch a Single Teacher Profile
    static async getTeacherById(teacherId) {
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
    }

    // Fetch List of Teachers (with optional status filter)
    static async getAllTeachers(status = null) {
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
        const [rows] = await db.execute(sql, params);
        return rows;
    }

    // Fetch List of Jobs (with optional status filter)
    static async getAllJobs(status = null) {
        let sql = `SELECT id, subject, class_level, location, status, created_at FROM jobs`;
        let params = [];
        if (status) {
            sql += ` WHERE status = ?`;
            params.push(status);
        }
        const [rows] = await db.execute(sql, params);
        return rows;
    }

    // Fetch List of Parents/Schools
    static async getAllParents() {
        const [rows] = await db.execute(`
            SELECT id, full_name, email, phone, role, created_at 
            FROM users WHERE role IN ('parent', 'school')
        `);
        return rows;
    }

    // Update Teacher Status (Approve/Reject)
    static async updateTeacherStatus(teacherId, status) {
        await db.execute(
            'UPDATE teacher_profiles SET status = ? WHERE user_id = ?',
            [status, teacherId]
        );
    }

    // Update Job Status (Publish)
    static async publishJob(jobId) {
        await db.execute(
            'UPDATE jobs SET status = "published" WHERE id = ?',
            [jobId]
        );
    }

    // Create Audit Log
    static async createAuditLog(adminId, action, targetId) {
        await db.execute(
            'INSERT INTO audit_logs (admin_id, action, target_id) VALUES (?, ?, ?)',
            [adminId, action, targetId]
        );
    }
}

module.exports = AdminModel;