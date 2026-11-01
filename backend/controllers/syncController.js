const { syncEngine } = require('../services/SyncEngine');
const { SyncQueue, SyncMetadata, SyncConflict } = require('../models/SyncQueue');

const normalizeConflictResolution = (resolution = '') => {
    const map = {
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
        ignored: 'skipped',
        IGNORED: 'skipped'
    };

    return map[resolution] || null;
};

const getEntityTypesForPriority = (priority) => {
    if (!priority) {
        return undefined;
    }

    const normalizedPriority = String(priority).toUpperCase();
    return Object.entries(syncEngine.syncTables)
        .filter(([, entityPriority]) => entityPriority === normalizedPriority)
        .map(([entityType]) => entityType);
};

const syncController = {
    getSyncStatus: async (req, res) => {
        try {
            const status = await syncEngine.getSyncStatus();

            res.json({
                success: true,
                status
            });
        } catch (error) {
            console.error('Get sync status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get sync status'
            });
        }
    },

    getPendingItems: async (req, res) => {
        try {
            const { priority, limit = 50, entityType } = req.query;
            const entityTypes = entityType
                ? [entityType]
                : getEntityTypesForPriority(priority);

            const items = await SyncQueue.getPendingItems(parseInt(limit, 10), {
                entityTypes
            });

            res.json({
                success: true,
                count: items.length,
                items
            });
        } catch (error) {
            console.error('Get pending items error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get pending items'
            });
        }
    },

    getQueueStats: async (req, res) => {
        try {
            const stats = await SyncQueue.getStats();

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get queue stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get queue stats'
            });
        }
    },

    triggerSync: async (req, res) => {
        try {
            const { priority } = req.body;

            if (priority) {
                await syncEngine.processSyncQueue(String(priority).toUpperCase());
            } else {
                await syncEngine.forceSyncAll();
            }

            const status = await syncEngine.getSyncStatus();

            res.json({
                success: true,
                message: 'Sync triggered successfully',
                status
            });
        } catch (error) {
            console.error('Trigger sync error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to trigger sync'
            });
        }
    },

    checkOnline: async (req, res) => {
        try {
            const isOnline = await syncEngine.checkOnlineStatus();

            res.json({
                success: true,
                isOnline,
                cloudEndpoint: process.env.CLOUD_API_URL ? 'Configured' : 'Not configured'
            });
        } catch (error) {
            console.error('Check online error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check online status'
            });
        }
    },

    getConflicts: async (req, res) => {
        try {
            const { status = 'pending' } = req.query;
            const where = {};

            if (String(status).toLowerCase() !== 'all') {
                where.resolution = String(status).toLowerCase();
            }

            const conflicts = await SyncConflict.findAll({
                where,
                order: [['created_at', 'DESC']],
                limit: 100
            });

            res.json({
                success: true,
                count: conflicts.length,
                conflicts
            });
        } catch (error) {
            console.error('Get conflicts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get conflicts'
            });
        }
    },

    resolveConflict: async (req, res) => {
        try {
            const { conflictId } = req.params;
            const { resolution } = req.body;
            const userId = req.user?.id;
            const normalizedResolution = normalizeConflictResolution(resolution);

            if (!normalizedResolution) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid resolution type'
                });
            }

            const conflict = await syncEngine.resolveConflict(conflictId, normalizedResolution, userId);

            res.json({
                success: true,
                message: 'Conflict resolved',
                conflict
            });
        } catch (error) {
            console.error('Resolve conflict error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to resolve conflict'
            });
        }
    },

    getSyncMetadata: async (req, res) => {
        try {
            const metadata = await SyncMetadata.findAll({
                order: [['entity_type', 'ASC']]
            });

            res.json({
                success: true,
                metadata
            });
        } catch (error) {
            console.error('Get sync metadata error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get sync metadata'
            });
        }
    },

    retryFailed: async (req, res) => {
        try {
            const { tableName, entityType } = req.body;
            const requestedEntityType = entityType || tableName;
            const where = { status: 'failed' };

            if (requestedEntityType) {
                where.entity_type = requestedEntityType;
            }

            const [count] = await SyncQueue.update(
                { status: 'pending', retry_count: 0, error_message: null },
                { where }
            );

            res.json({
                success: true,
                message: `${count} items queued for retry`,
                count
            });
        } catch (error) {
            console.error('Retry failed error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retry items'
            });
        }
    },

    cleanupOld: async (req, res) => {
        try {
            const { days = 30 } = req.body;
            const deleted = await syncEngine.cleanupOldItems(parseInt(days, 10));

            res.json({
                success: true,
                message: `Deleted ${deleted} old sync items`,
                deleted
            });
        } catch (error) {
            console.error('Cleanup error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cleanup old items'
            });
        }
    }
};

module.exports = syncController;
