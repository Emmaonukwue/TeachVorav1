const db = require('../config/db');

class JobModel {
    // Get all jobs (with optional status filter)
    static async getAll(status = null) {
        try {
            console.log("--- DEBUG: JobModel.getAll() called ---");
            let sql = 'SELECT id, subject, class_level, location, status, created_at FROM jobs';
            let params = [];
            if (status) {
                sql += ' WHERE status = ?';
                params.push(status);
            }
            console.log("DEBUG SQL:", sql);
            console.log("DEBUG Params:", params);
            
            const [rows] = await db.execute(sql, params);
            console.log("DEBUG: JobModel.getAll() found", rows.length, "jobs");
            return rows;
        } catch (err) {
            console.error("ERROR in JobModel.getAll():", err.message);
            return [];
        }
    }

    // Get pending jobs
    static async getPendingJobs() {
        try {
            const [rows] = await db.execute(
                'SELECT id, subject, class_level, location, teaching_mode, curriculum FROM jobs WHERE status = "pending_review"'
            );
            return rows;
        } catch (err) {
            console.error("ERROR in JobModel.getPendingJobs():", err.message);
            return [];
        }
    }

    // Create a new job
    static async create(jobData) {
        const { 
            user_id, subject, class_level, curriculum, location, 
            teaching_mode, schedule, start_date, budget, 
            teacher_requirements, additional_info 
        } = jobData;

        const [result] = await db.execute(
            `INSERT INTO jobs 
            (user_id, status, subject, class_level, curriculum, location, 
             teaching_mode, schedule, start_date, budget, teacher_requirements, additional_info)
             VALUES (?, 'pending_review', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, subject, class_level, curriculum, location, teaching_mode, 
             schedule, start_date, budget, teacher_requirements, additional_info]
        );
        return result.insertId;
    }

    // Get jobs for a specific user (Parent/School dashboard)
    static async findByUserId(userId) {
        if (!userId) return []; // Safety check
        const [rows] = await db.execute('SELECT * FROM jobs WHERE user_id = ?', [userId]);
        return rows;
    }

    // Get published jobs
    static async getPublishedJobs() {
        const [rows] = await db.execute(
            `SELECT id, subject, class_level, curriculum, location, teaching_mode, schedule, start_date 
             FROM jobs WHERE status = 'published'`
        );
        return rows;
    }

    // Publish a job
    static async publish(jobId) {
        await db.execute('UPDATE jobs SET status = "published" WHERE id = ?', [jobId]);
    }
}

module.exports = JobModel;