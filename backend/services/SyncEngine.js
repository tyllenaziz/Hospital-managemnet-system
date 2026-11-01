const axios = require('axios');
const { Op } = require('sequelize');
const { SyncQueue, SyncMetadata, SyncConflict } = require('../models/SyncQueue');

const normalizeResolution = (resolution = 'pending') => {
    const map = {
        pending: 'pending',
        PENDING: 'pending',
        local_wins: 'local_wins',
        LOCAL_WINS: 'local_wins',
        server_wins: 'server_wins',
        SERVER_WINS: 'server_wins',
        CLOUD_WINS: 'server_wins',
        cloud_wins: 'server_wins',
        merged: 'merged',
        MERGED: 'merged',
        skipped: 'skipped',
        SKIPPED: 'skipped',
        IGNORED: 'skipped',
        ignored: 'skipped'
    };

    const normalized = map[resolution];
    if (!normalized) {
        throw new Error('Invalid resolution type');
    }

    return normalized;
};

const conflictTypeForOperation = (operationType = 'update') => {
    switch (String(operationType).toLowerCase()) {
        case 'create':
        case 'insert':
            return 'create_conflict';
        case 'delete':
            return 'delete_conflict';
        default:
            return 'update_conflict';
    }
};

class SyncEngine {
    constructor() {
        this.isOnline = false;
        this.isSyncing = false;
        this.schedulerHandles = [];
        this.cloudEndpoint = process.env.CLOUD_API_URL || null;
        this.cloudApiKey = process.env.CLOUD_API_KEY || null;

        this.intervals = {
            HIGH: 60000,
            MEDIUM: 300000,
            LOW: 1800000
        };

        this.syncTables = {
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
    }

    getEntityTypesForPriority(priority) {
        if (!priority) {
            return [];
        }

        return Object.entries(this.syncTables)
            .filter(([, entityPriority]) => entityPriority === priority)
            .map(([entityType]) => entityType);
    }

    async initialize() {
        await this.checkOnlineStatus();

        for (const entityType of Object.keys(this.syncTables)) {
            await SyncMetadata.findOrCreate({
                where: { entity_type: entityType },
                defaults: { entity_type: entityType }
            });
        }

        this.startSyncScheduler();

    }

    async checkOnlineStatus() {
        if (!this.cloudEndpoint) {
            this.isOnline = false;
            return false;
        }

        try {
            const response = await axios.get(`${this.cloudEndpoint}/health`, {
                timeout: 5000
            });
            this.isOnline = response.status === 200;
        } catch (error) {
            this.isOnline = false;
        }

        return this.isOnline;
    }

    startSyncScheduler() {
        if (this.schedulerHandles.length > 0) {
            return;
        }

        this.schedulerHandles.push(
            setInterval(() => this.processSyncQueue('HIGH'), this.intervals.HIGH),
            setInterval(() => this.processSyncQueue('MEDIUM'), this.intervals.MEDIUM),
            setInterval(() => this.processSyncQueue('LOW'), this.intervals.LOW)
        );

    }

    stopSyncScheduler() {
        this.schedulerHandles.forEach((handle) => clearInterval(handle));
        this.schedulerHandles = [];
    }

    async queueForSync(entityType, entityId, operation, data, userId = null) {
        const priority = this.syncTables[entityType] || 'MEDIUM';

        try {
            await SyncQueue.addToQueue(entityType, entityId, operation, data, priority, userId);
            await SyncMetadata.findOrCreate({
                where: { entity_type: entityType },
                defaults: { entity_type: entityType }
            });

            if (this.isOnline && priority === 'HIGH') {
                setImmediate(() => {
                    this.processSyncQueue('HIGH').catch((error) => {
                        console.error('Immediate high-priority sync failed:', error.message);
                    });
                });
            }

            return true;
        } catch (error) {
            console.error('Error queuing for sync:', error);
            return false;
        }
    }

    async processSyncQueue(priority = null) {
        if (this.isSyncing) {
            return;
        }

        await this.checkOnlineStatus();
        if (!this.isOnline) {
            return;
        }

        this.isSyncing = true;

        try {
            const entityTypes = this.getEntityTypesForPriority(priority);
            const pendingItems = await SyncQueue.getPendingItems(50, {
                entityTypes: entityTypes.length > 0 ? entityTypes : undefined
            });

            if (pendingItems.length === 0) {
                return;
            }

            let successCount = 0;
            let failCount = 0;

            for (const item of pendingItems) {
                try {
                    await this.processItem(item);
                    successCount += 1;
                } catch (error) {
                    failCount += 1;
                    console.error(`Sync failed for ${item.entity_type}:${item.entity_id}:`, error.message);
                }
            }
        } catch (error) {
            console.error('Sync queue processing error:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    async processItem(item) {
        await SyncQueue.update(
            { status: 'syncing' },
            { where: { id: item.id } }
        );

        await SyncMetadata.update(
            { sync_status: 'syncing' },
            { where: { entity_type: item.entity_type } }
        );

        try {
            const response = await this.sendToCloud(item);

            if (response.success) {
                await SyncQueue.markAsSynced(item.id);
                await SyncMetadata.update(
                    {
                        last_sync_timestamp: new Date(),
                        sync_status: 'idle'
                    },
                    { where: { entity_type: item.entity_type } }
                );
                await SyncMetadata.increment('records_synced', {
                    by: 1,
                    where: { entity_type: item.entity_type }
                });
                return;
            }

            if (response.conflict) {
                await this.handleConflict(item, response.serverData || response.cloudData || null);
                return;
            }

            throw new Error(response.error || 'Unknown sync error');
        } catch (error) {
            await SyncQueue.markAsFailed(item.id, error.message);
            await SyncMetadata.update(
                { sync_status: 'error' },
                { where: { entity_type: item.entity_type } }
            );
            throw error;
        }
    }

    async sendToCloud(item) {
        if (!this.cloudEndpoint) {
            return { success: true };
        }

        try {
            const response = await axios.post(
                `${this.cloudEndpoint}/sync`,
                {
                    table: item.entity_type,
                    entity_type: item.entity_type,
                    record_id: item.entity_id,
                    entity_id: item.entity_id,
                    operation: item.operation_type,
                    operation_type: item.operation_type,
                    data: item.payload,
                    payload: item.payload,
                    local_timestamp: item.local_timestamp
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.cloudApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                }
            );

            return response.data;
        } catch (error) {
            if (error.response?.status === 409) {
                return {
                    success: false,
                    conflict: true,
                    serverData: error.response.data?.serverData || error.response.data?.cloudData || null
                };
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleConflict(item, serverData) {
        await SyncConflict.create({
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            local_data: item.payload,
            server_data: serverData,
            conflict_type: conflictTypeForOperation(item.operation_type),
            resolution: 'pending'
        });

        await SyncQueue.update(
            { status: 'conflict' },
            { where: { id: item.id } }
        );

    }

    async resolveConflict(conflictId, resolution, userId) {
        const conflict = await SyncConflict.findByPk(conflictId);
        if (!conflict) {
            throw new Error('Conflict not found');
        }

        const normalizedResolution = normalizeResolution(resolution);
        let dataToUse = null;

        switch (normalizedResolution) {
            case 'local_wins':
                dataToUse = conflict.local_data;
                break;
            case 'server_wins':
                dataToUse = conflict.server_data;
                break;
            case 'merged':
                dataToUse = {
                    ...(conflict.server_data || {}),
                    ...(conflict.local_data || {})
                };
                break;
            case 'skipped':
                dataToUse = null;
                break;
            default:
                throw new Error('Invalid resolution type');
        }

        await conflict.update({
            resolution: normalizedResolution,
            resolved_by: userId,
            resolved_at: new Date()
        });

        if (normalizedResolution !== 'skipped') {
            await this.queueForSync(
                conflict.entity_type,
                conflict.entity_id,
                'update',
                dataToUse,
                userId
            );
        }

        return conflict;
    }

    async pullFromCloud(entityType, since = null) {
        if (!this.cloudEndpoint) {
            return { success: false, error: 'No cloud endpoint configured' };
        }

        try {
            const response = await axios.get(
                `${this.cloudEndpoint}/sync/${entityType}`,
                {
                    params: { since },
                    headers: {
                        Authorization: `Bearer ${this.cloudApiKey}`
                    },
                    timeout: 60000
                }
            );

            return {
                success: true,
                data: response.data.records,
                count: response.data.records.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getSyncStatus() {
        const queueStats = await SyncQueue.getStats();
        const pendingByEntity = await SyncQueue.getPendingCountsByEntity();
        const metadata = await SyncMetadata.findAll();

        const tableStats = {};
        metadata.forEach((entry) => {
            tableStats[entry.entity_type] = {
                lastSync: entry.last_sync_timestamp,
                totalSynced: entry.records_synced,
                pending: pendingByEntity[entry.entity_type] || 0,
                status: entry.sync_status
            };
        });

        const conflicts = await SyncConflict.count({
            where: { resolution: 'pending' }
        });

        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            queue: queueStats,
            tables: tableStats,
            pendingConflicts: conflicts,
            cloudEndpoint: this.cloudEndpoint ? 'Configured' : 'Not configured'
        };
    }

    async forceSyncAll() {
        await this.processSyncQueue('HIGH');
        await this.processSyncQueue('MEDIUM');
        await this.processSyncQueue('LOW');

        return await this.getSyncStatus();
    }

    async cleanupOldItems(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const deleted = await SyncQueue.destroy({
            where: {
                status: 'synced',
                synced_at: { [Op.lt]: cutoffDate }
            }
        });

        return deleted;
    }
}

const syncEngine = new SyncEngine();

module.exports = { SyncEngine, syncEngine };
