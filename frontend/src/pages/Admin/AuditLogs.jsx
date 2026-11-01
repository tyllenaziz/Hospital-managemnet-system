import React, { useState, useEffect } from 'react';
import {
    Search, Filter, Download, RefreshCw, Eye, Calendar, User,
    Activity, FileText, ArrowLeft, ChevronLeft, ChevronRight,
    Shield, Clock, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const AuditLogs = () => {
    const { authenticatedFetch } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        action: '',
        entityType: '',
        startDate: '',
        endDate: '',
        userId: ''
    });

    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
        fetchSummary();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

            const response = await authenticatedFetch(`${API_BASE_URL}/audit?${params}`);
            const data = await response.json();

            if (data.success) {
                setLogs(data.logs);
                setPagination(prev => ({ ...prev, ...data.pagination }));
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([k, v]) => v && ['startDate', 'endDate'].includes(k)))
            );
            const response = await authenticatedFetch(`${API_BASE_URL}/audit/summary?${params}`);
            const data = await response.json();
            if (data.success) {
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            );
            const response = await authenticatedFetch(`${API_BASE_URL}/audit/export?${params}`);
            const data = await response.json();

            if (data.success && data.logs) {
                // Convert to CSV
                const headers = ['ID', 'Time', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Description', 'IP Address'];
                const rows = data.logs.map(log => [
                    log.id, log.created_at, log.username, log.user_role, log.action,
                    log.entity_type, log.entity_id, `"${(log.description || '').replace(/"/g, '""')}"`, log.ip_address
                ]);

                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
            }
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700';
            case 'UPDATE': return 'bg-blue-100 text-blue-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            case 'LOGIN': return 'bg-purple-100 text-purple-700';
            case 'LOGOUT': return 'bg-gray-100 text-gray-700';
            case 'PAYMENT': return 'bg-emerald-100 text-emerald-700';
            case 'DISPENSE': return 'bg-amber-100 text-amber-700';
            case 'PRINT': return 'bg-cyan-100 text-cyan-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const actions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'PAYMENT', 'DISPENSE', 'PRINT', 'SHIFT_OPEN', 'SHIFT_CLOSE'];
    const entityTypes = ['patient', 'bill', 'prescription', 'medicine', 'user', 'queue', 'lab_order', 'cashier_shift'];

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Shield className="text-blue-600" />
                            Audit Trail
                        </h1>
                        <p className="text-gray-600">Track all system activities and user actions</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                        <Filter size={18} />
                        Filters
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => { fetchLogs(); fetchSummary(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            <Activity className="text-blue-600" size={24} />
                            <div>
                                <p className="text-gray-500 text-sm">Total Actions</p>
                                <p className="text-2xl font-bold">{summary.totalActions}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            <User className="text-purple-600" size={24} />
                            <div>
                                <p className="text-gray-500 text-sm">Active Users</p>
                                <p className="text-2xl font-bold">{summary.userActivity?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            <FileText className="text-green-600" size={24} />
                            <div>
                                <p className="text-gray-500 text-sm">Entity Types</p>
                                <p className="text-2xl font-bold">{summary.entityCounts?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            <Clock className="text-amber-600" size={24} />
                            <div>
                                <p className="text-gray-500 text-sm">Most Common</p>
                                <p className="text-lg font-bold">{summary.actionCounts?.[0]?.action || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-xl p-4 shadow border">
                    <h3 className="font-semibold mb-4">Filter Logs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Search</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Search..."
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Action</label>
                            <select
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">All Actions</option>
                                {actions.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Entity Type</label>
                            <select
                                value={filters.entityType}
                                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">All Types</option>
                                {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ search: '', action: '', entityType: '', startDate: '', endDate: '', userId: '' })}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Entity</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Description</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        <RefreshCw className="animate-spin mx-auto mb-2" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No audit logs found
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                            {log.created_at}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900">{log.username}</div>
                                            <div className="text-xs text-gray-500">{log.user_role}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">{log.entity_type}</div>
                                            {log.entity_id && <div className="text-xs text-gray-500">ID: {log.entity_id}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                                            {log.description}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {log.ip_address}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {(log.old_values || log.new_values) && (
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye size={16} className="text-gray-500" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            disabled={pagination.page <= 1}
                            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-3 py-2 text-sm">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Audit Log Details</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">User</label>
                                    <p className="font-medium">{selectedLog.username} ({selectedLog.user_role})</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Action</label>
                                    <p className="font-medium">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Entity</label>
                                    <p className="font-medium">{selectedLog.entity_type} #{selectedLog.entity_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Time</label>
                                    <p className="font-medium">{selectedLog.created_at}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Description</label>
                                <p className="font-medium">{selectedLog.description}</p>
                            </div>
                            {selectedLog.old_values && (
                                <div>
                                    <label className="text-sm text-gray-500">Previous State</label>
                                    <pre className="bg-red-50 p-3 rounded text-sm overflow-x-auto">
                                        {JSON.stringify(JSON.parse(selectedLog.old_values), null, 2)}
                                    </pre>
                                </div>
                            )}
                            {selectedLog.new_values && (
                                <div>
                                    <label className="text-sm text-gray-500">New State</label>
                                    <pre className="bg-green-50 p-3 rounded text-sm overflow-x-auto">
                                        {JSON.stringify(JSON.parse(selectedLog.new_values), null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
