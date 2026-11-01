const db = require("../config/dbconfig");

const auditController = {
    /**
     * Get audit logs with filters
     */
    getAuditLogs: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 50,
                userId,
                action,
                entityType,
                startDate,
                endDate,
                search
            } = req.query;

            const offset = (page - 1) * limit;
            const hospitalId = req.user.hospital_id;
            let whereConditions = ['hospital_id = ?'];
            let params = [hospitalId];

            if (userId) {
                whereConditions.push('user_id = ?');
                params.push(userId);
            }

            if (action) {
                whereConditions.push('action = ?');
                params.push(action);
            }

            if (entityType) {
                whereConditions.push('entity_type = ?');
                params.push(entityType);
            }

            if (startDate) {
                whereConditions.push('DATE(created_at) >= ?');
                params.push(startDate);
            }

            if (endDate) {
                whereConditions.push('DATE(created_at) <= ?');
                params.push(endDate);
            }

            if (search) {
                whereConditions.push('(description LIKE ? OR username LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            // Get total count
            const [countResult] = await db.query(
                `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
                params
            );
            const total = countResult[0]?.total || 0;

            // Get logs
            const [logs] = await db.query(
                `SELECT 
          id, user_id, username, user_role, action, entity_type, entity_id,
          description, old_values, new_values, ip_address, 
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
        FROM audit_logs 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
                [...params, parseInt(limit), parseInt(offset)]
            );

            res.json({
                success: true,
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Get audit logs error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch audit logs',
                details: error.message
            });
        }
    },

    /**
     * Get audit logs for a specific entity
     */
    getAuditLogsByEntity: async (req, res) => {
        try {
            const { entityType, entityId } = req.params;

            const hospitalId = req.user.hospital_id;

            const [logs] = await db.query(
                `SELECT 
          id, user_id, username, user_role, action, 
          description, old_values, new_values,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
        FROM audit_logs 
        WHERE entity_type = ? AND entity_id = ? AND hospital_id = ?
        ORDER BY created_at DESC
        LIMIT 100`,
                [entityType, entityId, hospitalId]
            );

            res.json({ success: true, logs });

        } catch (error) {
            console.error('Get entity audit logs error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch entity audit logs'
            });
        }
    },

    /**
     * Get audit summary statistics
     */
    getAuditSummary: async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const hospitalId = req.user.hospital_id;
            const today = new Date().toISOString().split('T')[0];

            let dateCondition = 'DATE(created_at) = ?';
            let dateParams = [today];
            if (startDate && endDate) {
                dateCondition = 'DATE(created_at) BETWEEN ? AND ?';
                dateParams = [startDate, endDate];
            }

            const [actionCounts] = await db.query(`
        SELECT action, COUNT(*) as count
        FROM audit_logs
        WHERE ${dateCondition} AND hospital_id = ?
        GROUP BY action
        ORDER BY count DESC
      `, [...dateParams, hospitalId]);

            const [userActivity] = await db.query(`
        SELECT username, user_role, COUNT(*) as action_count
        FROM audit_logs
        WHERE ${dateCondition} AND hospital_id = ?
        GROUP BY user_id, username, user_role
        ORDER BY action_count DESC
        LIMIT 10
      `, [...dateParams, hospitalId]);

            const [entityCounts] = await db.query(`
        SELECT entity_type, COUNT(*) as count
        FROM audit_logs
        WHERE ${dateCondition} AND hospital_id = ?
        GROUP BY entity_type
        ORDER BY count DESC
      `, [...dateParams, hospitalId]);

            const [totalActions] = await db.query(`
        SELECT COUNT(*) as total
        FROM audit_logs
        WHERE ${dateCondition} AND hospital_id = ?
      `, [...dateParams, hospitalId]);

            res.json({
                success: true,
                summary: {
                    totalActions: totalActions[0]?.total || 0,
                    actionCounts,
                    userActivity,
                    entityCounts
                }
            });

        } catch (error) {
            console.error('Get audit summary error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch audit summary'
            });
        }
    },

    /**
     * Export audit logs to CSV format
     */
    exportAuditLogs: async (req, res) => {
        try {
            const { startDate, endDate, userId, action, entityType } = req.query;

            let whereConditions = ['hospital_id = ?'];
            let params = [req.user.hospital_id];

            if (userId) {
                whereConditions.push('user_id = ?');
                params.push(userId);
            }
            if (action) {
                whereConditions.push('action = ?');
                params.push(action);
            }
            if (entityType) {
                whereConditions.push('entity_type = ?');
                params.push(entityType);
            }
            if (startDate) {
                whereConditions.push('DATE(created_at) >= ?');
                params.push(startDate);
            }
            if (endDate) {
                whereConditions.push('DATE(created_at) <= ?');
                params.push(endDate);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            const [logs] = await db.query(
                `SELECT 
          id, username, user_role, action, entity_type, entity_id,
          description, ip_address,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
        FROM audit_logs 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 10000`,
                params
            );

            res.json({ success: true, logs });

        } catch (error) {
            console.error('Export audit logs error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export audit logs'
            });
        }
    }
};

module.exports = auditController;
