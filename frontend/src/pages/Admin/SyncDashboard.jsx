import React, { useState, useEffect, useCallback } from 'react';
import {
    Cloud,
    CloudOff,
    RefreshCw,
    Check,
    AlertCircle,
    Clock,
    AlertTriangle,
    Loader2,
    Database,
    ArrowUpCircle,
    ArrowDownCircle,
    CheckCircle,
    XCircle,
    Settings,
    Trash2,
    RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SyncDashboard = () => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [conflicts, setConflicts] = useState([]);
    const [notification, setNotification] = useState(null);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/sync/status`);
            const data = await response.json();
            if (data.success) {
                setStatus(data.status);
            }
        } catch (error) {
            console.error('Error fetching sync status:', error);
        } finally {
            setLoading(false);
        }
    }, [authenticatedFetch, API_BASE_URL]);

    const fetchConflicts = useCallback(async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/sync/conflicts`);
            const data = await response.json();
            if (data.success) {
                setConflicts(data.conflicts);
            }
        } catch (error) {
            console.error('Error fetching conflicts:', error);
        }
    }, [authenticatedFetch, API_BASE_URL]);

    useEffect(() => {
        fetchStatus();
        fetchConflicts();

        // Refresh every 30 seconds
        const interval = setInterval(() => {
            fetchStatus();
            fetchConflicts();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchStatus, fetchConflicts]);

    const triggerSync = async (priority = null) => {
        setSyncing(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/sync/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priority })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Sync completed successfully', 'success');
                await fetchStatus();
            }
        } catch (error) {
            showNotification('Sync failed', 'error');
        } finally {
            setSyncing(false);
        }
    };

    const retryFailed = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/sync/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.success) {
                showNotification(`${data.count} items queued for retry`, 'success');
                await fetchStatus();
            }
        } catch (error) {
            showNotification('Failed to retry items', 'error');
        }
    };

    const cleanupOld = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/sync/cleanup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: 30 })
            });
            const data = await response.json();
            if (data.success) {
                showNotification(`${data.deleted} old items cleaned up`, 'success');
                await fetchStatus();
            }
        } catch (error) {
            showNotification('Cleanup failed', 'error');
        }
    };

    const resolveConflict = async (conflictId, resolution) => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/sync/conflicts/${conflictId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolution })
            });
            const data = await response.json();
            if (data.success) {
                showNotification('Conflict resolved', 'success');
                await fetchConflicts();
                await fetchStatus();
            }
        } catch (error) {
            showNotification('Failed to resolve conflict', 'error');
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading sync status...</p>
                </div>
            </div>
        );
    }

    const pendingTotal = status?.queue?.pending?.total || 0;

    return (
        <div className="p-6 space-y-6">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {notification.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Cloud className="text-blue-600" />
                        Sync Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">Monitor and manage offline data synchronization</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStatus}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={20} />
                    </button>
                    <button
                        onClick={() => triggerSync()}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {syncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpCircle size={20} />}
                        Sync Now
                    </button>
                </div>
            </div>

            {/* Connection Status Banner */}
            <div className={`rounded-xl p-4 flex items-center justify-between ${status?.isOnline
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
                    : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
                }`}>
                <div className="flex items-center gap-3">
                    {status?.isOnline ? (
                        <Cloud className="text-green-600" size={24} />
                    ) : (
                        <CloudOff className="text-red-600" size={24} />
                    )}
                    <div>
                        <p className={`font-semibold ${status?.isOnline ? 'text-green-800' : 'text-red-800'}`}>
                            {status?.isOnline ? 'Connected to Cloud' : 'Offline Mode'}
                        </p>
                        <p className={`text-sm ${status?.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                            {status?.isOnline
                                ? 'Data will sync automatically'
                                : 'Changes saved locally, will sync when online'}
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status?.isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {status?.cloudEndpoint}
                </span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Pending Sync</p>
                            <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingTotal}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                        High: {status?.queue?.pending?.HIGH || 0} |
                        Med: {status?.queue?.pending?.MEDIUM || 0} |
                        Low: {status?.queue?.pending?.LOW || 0}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Synced</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{status?.queue?.synced || 0}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Failed</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">{status?.queue?.failed || 0}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <XCircle className="text-red-600" size={24} />
                        </div>
                    </div>
                    {(status?.queue?.failed || 0) > 0 && (
                        <button
                            onClick={retryFailed}
                            className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                            <RotateCcw size={14} /> Retry All
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Conflicts</p>
                            <p className="text-3xl font-bold text-orange-600 mt-1">{status?.pendingConflicts || 0}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <AlertTriangle className="text-orange-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Stats */}
            {status?.tables && Object.keys(status.tables).length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Database size={18} className="text-blue-600" />
                            Table Sync Status
                        </h2>
                        <button
                            onClick={cleanupOld}
                            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            <Trash2 size={14} /> Cleanup Old
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Table</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Last Sync</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Synced</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Pending</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Object.entries(status.tables).map(([table, data]) => (
                                    <tr key={table} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{table}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {data.lastSync ? new Date(data.lastSync).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{data.totalSynced || 0}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{data.pending || 0}</td>
                                        <td className="px-4 py-3">
                                            {data.status === 'SUCCESS' && (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Success</span>
                                            )}
                                            {data.status === 'PARTIAL' && (
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Partial</span>
                                            )}
                                            {data.status === 'FAILED' && (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Failed</span>
                                            )}
                                            {!data.status && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Conflicts List */}
            {conflicts.length > 0 && (
                <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                    <div className="p-4 border-b border-orange-100 bg-orange-50">
                        <h2 className="font-semibold text-orange-800 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            Sync Conflicts ({conflicts.length})
                        </h2>
                        <p className="text-sm text-orange-600 mt-1">These records have conflicting changes that need resolution</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {conflicts.slice(0, 10).map(conflict => (
                            <div key={conflict.id} className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {conflict.table_name} #{conflict.record_id}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Local: {new Date(conflict.local_timestamp).toLocaleString()} |
                                            Cloud: {new Date(conflict.cloud_timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => resolveConflict(conflict.id, 'LOCAL_WINS')}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
                                        >
                                            Keep Local
                                        </button>
                                        <button
                                            onClick={() => resolveConflict(conflict.id, 'CLOUD_WINS')}
                                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200"
                                        >
                                            Keep Cloud
                                        </button>
                                        <button
                                            onClick={() => resolveConflict(conflict.id, 'IGNORED')}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                                        >
                                            Ignore
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h2 className="font-semibold text-gray-900 mb-4">Quick Sync Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => triggerSync('HIGH')}
                        disabled={syncing}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                        Sync High Priority
                    </button>
                    <button
                        onClick={() => triggerSync('MEDIUM')}
                        disabled={syncing}
                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                    >
                        Sync Medium Priority
                    </button>
                    <button
                        onClick={() => triggerSync('LOW')}
                        disabled={syncing}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Sync Low Priority
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncDashboard;
