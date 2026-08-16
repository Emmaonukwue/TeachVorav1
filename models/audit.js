const db = require('../config/db');

class AuditModel {
    // Log an admin action
    static async log(adminId, action, targetId) {
        await db.execute(
            'INSERT INTO audit_logs (admin_id, action, target_id) VALUES (?, ?, ?)',
            [adminId, action, targetId]
        );
    }
}

module.exports = AuditModel;