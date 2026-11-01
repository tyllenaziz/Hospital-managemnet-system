const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const ENTITY_PRIORITIES = {
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

const normalizeOperationType = (operation = 'update') => {
    const normalized = String(operation).trim().toLowerCase();

    if (normalized === 'insert') {
        return 'create';
    }

    if (['create', 'update', 'delete'].includes(normalized)) {
        return normalized;
    }

    throw new Error(`Invalid sync operation type: ${operation}`);
};

const SyncQueue = sequelize.define('SyncQueue', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    operation_type: {
        type: DataTypes.ENUM('create', 'update', 'delete'),
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'syncing', 'synced', 'failed', 'conflict'),
        defaultValue: 'pending'
    },
    retry_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    max_retries: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    error_message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    local_timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    synced_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'sync_queue',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
        { fields: ['status'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['local_timestamp'] }
    ]
});

const SyncMetadata = sequelize.define('SyncMetadata', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    entity_type: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    last_sync_timestamp: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_server_cursor: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    sync_status: {
        type: DataTypes.ENUM('idle', 'syncing', 'error'),
        defaultValue: 'idle'
    },
    records_synced: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'sync_metadata',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
});

const SyncConflict = sequelize.define('SyncConflict', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    local_data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    server_data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    conflict_type: {
        type: DataTypes.ENUM('update_conflict', 'delete_conflict', 'create_conflict'),
        allowNull: false
    },
    resolution: {
        type: DataTypes.ENUM('pending', 'local_wins', 'server_wins', 'merged', 'skipped'),
        defaultValue: 'pending'
    },
    resolved_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    resolved_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'sync_conflicts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
});

SyncQueue.addToQueue = async function (entityType, entityId, operation, payload, priority = 'MEDIUM', userId = null) {
    return await SyncQueue.create({
        entity_type: entityType,
        entity_id: entityId,
        operation_type: normalizeOperationType(operation),
        payload,
        status: 'pending'
    });
};

SyncQueue.getPendingItems = async function (limit = 100, options = {}) {
    const where = { status: 'pending' };

    if (options.entityTypes?.length) {
        where.entity_type = { [Op.in]: options.entityTypes };
    }

    return await SyncQueue.findAll({
        where,
        order: [['local_timestamp', 'ASC']],
        limit
    });
};

SyncQueue.markAsSynced = async function (id) {
    return await SyncQueue.update(
        { status: 'synced', synced_at: new Date(), error_message: null },
        { where: { id } }
    );
};

SyncQueue.markAsFailed = async function (id, errorMessage) {
    const item = await SyncQueue.findByPk(id);
    if (item) {
        await item.update({
            status: 'failed',
            error_message: errorMessage,
            retry_count: item.retry_count + 1
        });
    }
};

SyncQueue.getPendingCountsByEntity = async function () {
    const [results] = await sequelize.query(`
        SELECT entity_type, COUNT(*) as count
        FROM sync_queue
        WHERE status = 'pending'
        GROUP BY entity_type
    `);

    return results.reduce((accumulator, row) => {
        accumulator[row.entity_type] = Number(row.count);
        return accumulator;
    }, {});
};

SyncQueue.getStats = async function () {
    const [results] = await sequelize.query(`
        SELECT entity_type, status, COUNT(*) as count
        FROM sync_queue
        GROUP BY entity_type, status
    `);

    const stats = {
        pending: { HIGH: 0, MEDIUM: 0, LOW: 0, total: 0 },
        synced: 0,
        failed: 0,
        conflict: 0,
        byEntity: {}
    };

    results.forEach((row) => {
        const count = Number(row.count);
        const priority = ENTITY_PRIORITIES[row.entity_type] || 'MEDIUM';

        if (!stats.byEntity[row.entity_type]) {
            stats.byEntity[row.entity_type] = {
                pending: 0,
                synced: 0,
                failed: 0,
                conflict: 0,
                priority
            };
        }

        if (row.status === 'pending') {
            stats.pending[priority] += count;
            stats.pending.total += count;
            stats.byEntity[row.entity_type].pending += count;
            return;
        }

        if (row.status === 'synced') {
            stats.synced += count;
            stats.byEntity[row.entity_type].synced += count;
            return;
        }

        if (row.status === 'failed') {
            stats.failed += count;
            stats.byEntity[row.entity_type].failed += count;
            return;
        }

        if (row.status === 'conflict') {
            stats.conflict += count;
            stats.byEntity[row.entity_type].conflict += count;
        }
    });

    return stats;
};

module.exports = {
    SyncQueue,
    SyncMetadata,
    SyncConflict,
    ENTITY_PRIORITIES
};
