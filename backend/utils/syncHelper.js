const { SyncQueue } = require('../models/SyncQueue');

const tablePriorities = {
    patients: 'HIGH',
    prescriptions: 'HIGH',
    lab_orders: 'HIGH',
    lab_results: 'HIGH',
    bills: 'HIGH',
    radiology_orders: 'HIGH',
    queue: 'MEDIUM',
    vitals: 'MEDIUM',
    medicines: 'MEDIUM',
    inventory: 'MEDIUM',
    consultations: 'MEDIUM',
    audit_logs: 'LOW',
    settings: 'LOW',
    attendance: 'LOW'
};

const trackCreate = async (tableName, recordId, data, userId = null) => {
    try {
        const priority = tablePriorities[tableName] || 'MEDIUM';
        await SyncQueue.addToQueue(tableName, recordId, 'create', data, priority, userId);
        return true;
    } catch (error) {
        console.error(`Sync track CREATE error for ${tableName}:${recordId}:`, error);
        return false;
    }
};

const trackUpdate = async (tableName, recordId, data, userId = null) => {
    try {
        const priority = tablePriorities[tableName] || 'MEDIUM';
        await SyncQueue.addToQueue(tableName, recordId, 'update', data, priority, userId);
        return true;
    } catch (error) {
        console.error(`Sync track UPDATE error for ${tableName}:${recordId}:`, error);
        return false;
    }
};

const trackDelete = async (tableName, recordId, userId = null) => {
    try {
        const priority = tablePriorities[tableName] || 'MEDIUM';
        await SyncQueue.addToQueue(tableName, recordId, 'delete', { deleted: true }, priority, userId);
        return true;
    } catch (error) {
        console.error(`Sync track DELETE error for ${tableName}:${recordId}:`, error);
        return false;
    }
};

const trackBatch = async (operations) => {
    const results = [];

    for (const operation of operations) {
        let result = false;

        switch (operation.type) {
            case 'INSERT':
            case 'CREATE':
                result = await trackCreate(operation.table, operation.id, operation.data, operation.userId);
                break;
            case 'UPDATE':
                result = await trackUpdate(operation.table, operation.id, operation.data, operation.userId);
                break;
            case 'DELETE':
                result = await trackDelete(operation.table, operation.id, operation.userId);
                break;
            default:
                result = false;
                break;
        }

        results.push({ ...operation, success: result });
    }

    return results;
};

const getSyncStatus = async (tableName, recordId) => {
    const item = await SyncQueue.findOne({
        where: {
            entity_type: tableName,
            entity_id: recordId
        },
        order: [['created_at', 'DESC']]
    });

    if (!item) {
        return { status: 'NOT_TRACKED', synced: true };
    }

    return {
        status: String(item.status || '').toUpperCase(),
        synced: item.status === 'synced',
        lastAttempt: item.updated_at,
        attempts: item.retry_count,
        error: item.error_message
    };
};

const hasPendingSync = async () => {
    const count = await SyncQueue.count({
        where: { status: 'pending' }
    });

    return count > 0;
};

const getPendingByTable = async () => {
    const [results] = await require('../config/sequelize').sequelize.query(`
        SELECT entity_type, COUNT(*) as count
        FROM sync_queue
        WHERE status = 'pending'
        GROUP BY entity_type
        ORDER BY count DESC
    `);

    return results;
};

module.exports = {
    trackCreate,
    trackUpdate,
    trackDelete,
    trackBatch,
    getSyncStatus,
    hasPendingSync,
    getPendingByTable,
    tablePriorities
};
