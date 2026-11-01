const db = require("../config/dbconfig");

/**
 * Audit Logger Utility
 * Logs all user actions to the audit_logs table
 */
const auditLogger = {
    /**
     * Log an action to the audit trail
     * @param {Object} params - Logging parameters
     * @param {Object} params.req - Express request object (for user info)
     * @param {string} params.action - Action type (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, etc.)
     * @param {string} params.entityType - Type of entity (patient, bill, prescription, etc.)
     * @param {number} params.entityId - ID of the entity
     * @param {string} params.description - Human-readable description
     * @param {Object} params.oldValues - Previous state (for updates)
     * @param {Object} params.newValues - New state (for creates/updates)
     */
    log: async ({ req, action, entityType, entityId, description, oldValues = null, newValues = null }) => {
        try {
            const userId = req?.user?.id || null;
            const username = req?.user?.username || 'System';
            const userRole = req?.user?.role || 'system';
            const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
            const userAgent = req?.get('User-Agent') || null;

            const query = `
        INSERT INTO audit_logs 
        (user_id, username, user_role, action, entity_type, entity_id, description, old_values, new_values, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            await db.query(query, [
                userId,
                username,
                userRole,
                action,
                entityType,
                entityId,
                description,
                oldValues ? JSON.stringify(oldValues) : null,
                newValues ? JSON.stringify(newValues) : null,
                ipAddress,
                userAgent
            ]);

            return true;
        } catch (error) {
            console.error('Audit logging error:', error);
            // Don't throw - audit logging should not break main operations
            return false;
        }
    },

    // Convenience methods for common actions
    logCreate: async (req, entityType, entityId, description, newValues = null) => {
        return auditLogger.log({ req, action: 'CREATE', entityType, entityId, description, newValues });
    },

    logUpdate: async (req, entityType, entityId, description, oldValues = null, newValues = null) => {
        return auditLogger.log({ req, action: 'UPDATE', entityType, entityId, description, oldValues, newValues });
    },

    logDelete: async (req, entityType, entityId, description, oldValues = null) => {
        return auditLogger.log({ req, action: 'DELETE', entityType, entityId, description, oldValues });
    },

    logView: async (req, entityType, entityId, description) => {
        return auditLogger.log({ req, action: 'VIEW', entityType, entityId, description });
    },

    logLogin: async (req, userId, username) => {
        return auditLogger.log({
            req,
            action: 'LOGIN',
            entityType: 'user',
            entityId: userId,
            description: `User ${username} logged in`
        });
    },

    logLogout: async (req, userId, username) => {
        return auditLogger.log({
            req,
            action: 'LOGOUT',
            entityType: 'user',
            entityId: userId,
            description: `User ${username} logged out`
        });
    },

    logPayment: async (req, entityType, entityId, description, paymentDetails = null) => {
        return auditLogger.log({
            req,
            action: 'PAYMENT',
            entityType,
            entityId,
            description,
            newValues: paymentDetails
        });
    },

    logDispense: async (req, prescriptionId, description, dispensedItems = null) => {
        return auditLogger.log({
            req,
            action: 'DISPENSE',
            entityType: 'prescription',
            entityId: prescriptionId,
            description,
            newValues: dispensedItems
        });
    },

    logPrint: async (req, entityType, entityId, description) => {
        return auditLogger.log({ req, action: 'PRINT', entityType, entityId, description });
    },

    logShiftAction: async (req, shiftId, action, description, details = null) => {
        return auditLogger.log({
            req,
            action: action,
            entityType: 'cashier_shift',
            entityId: shiftId,
            description,
            newValues: details
        });
    }
};

module.exports = auditLogger;
