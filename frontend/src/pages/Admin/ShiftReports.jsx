import React, { useState, useEffect } from 'react';
import {
    DollarSign, Users, Clock, CheckCircle, AlertTriangle, XCircle,
    Calendar, RefreshCw, Eye, Filter, ArrowLeft, TrendingUp, TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const ShiftReports = () => {
    const { authenticatedFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [shifts, setShifts] = useState([]);
    const [report, setReport] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
    const [filters, setFilters] = useState({
        status: '',
        startDate: '',
        endDate: ''
    });
    const [selectedShift, setSelectedShift] = useState(null);
    const [shiftTransactions, setShiftTransactions] = useState([]);

    useEffect(() => {
        fetchShifts();
        fetchReport();
    }, [pagination.page, filters]);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/shifts?${params}`);
            const data = await response.json();

            if (data.success) {
                setShifts(data.shifts);
                setPagination(prev => ({ ...prev, ...data.pagination }));
            }
        } catch (error) {
            console.error('Error fetching shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReport = async () => {
        try {
            const params = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([k, v]) => v && ['startDate', 'endDate'].includes(k)))
            );
            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/report?${params}`);
            const data = await response.json();
            if (data.success) {
                setReport(data.report);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        }
    };

    const viewShiftDetails = async (shift) => {
        setSelectedShift(shift);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/shift/${shift.id}/transactions`);
            const data = await response.json();
            if (data.success) {
                setShiftTransactions(data.transactions);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handleVerify = async (shiftId, status) => {
        try {
            const notes = prompt('Enter verification notes (optional):');
            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/shift/${shiftId}/verify`, {
                method: 'PUT',
                body: JSON.stringify({ status, verifier_notes: notes })
            });
            const data = await response.json();
            if (data.success) {
                fetchShifts();
                setSelectedShift(null);
            }
        } catch (error) {
            console.error('Error verifying shift:', error);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-blue-100 text-blue-700';
            case 'verified': return 'bg-purple-100 text-purple-700';
            case 'disputed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getVarianceClass = (variance) => {
        if (variance === 0 || variance === null) return 'text-gray-600';
        return variance > 0 ? 'text-green-600' : 'text-red-600';
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <DollarSign className="text-green-600" />
                            Shift Reports
                        </h1>
                        <p className="text-gray-600">Monitor and verify cashier shifts</p>
                    </div>
                </div>
                <button
                    onClick={() => { fetchShifts(); fetchReport(); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            {report?.summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            <Clock className="text-blue-600" size={24} />
                            <div>
                                <p className="text-gray-500 text-sm">Total Shifts</p>
                                <p className="text-2xl font-bold">{report.summary.total_shifts || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            <DollarSign className="text-green-600" size={24} />
                            <div>
                                <p className="text-gray-500 text-sm">Expected Cash</p>
                                <p className="text-xl font-bold">KES {(report.summary.total_expected_cash || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="text-purple-600" size={24} />
                            <div>
                                <p className="text-gray-500 text-sm">Actual Cash</p>
                                <p className="text-xl font-bold">KES {(report.summary.total_actual_cash || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            {(report.summary.total_variance || 0) >= 0 ? (
                                <TrendingUp className="text-green-600" size={24} />
                            ) : (
                                <TrendingDown className="text-red-600" size={24} />
                            )}
                            <div>
                                <p className="text-gray-500 text-sm">Total Variance</p>
                                <p className={`text-xl font-bold ${getVarianceClass(report.summary.total_variance)}`}>
                                    KES {(report.summary.total_variance || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow border">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="text-amber-600" size={24} />
                            <div>
                                <p className="text-gray-500 text-sm">Shortages</p>
                                <p className="text-2xl font-bold">{report.summary.shifts_with_shortage || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow border">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-3 py-2 border rounded-lg"
                        >
                            <option value="">All</option>
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                            <option value="verified">Verified</option>
                            <option value="disputed">Disputed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="px-3 py-2 border rounded-lg"
                        />
                    </div>
                    <button
                        onClick={() => setFilters({ status: '', startDate: '', endDate: '' })}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* By User Summary */}
            {report?.byUser && report.byUser.length > 0 && (
                <div className="bg-white rounded-xl shadow border overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Users size={18} />
                            Summary by Cashier
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cashier</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Shifts</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Expected</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actual</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Variance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {report.byUser.map((user, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{user.username}</td>
                                        <td className="px-4 py-3 text-center">{user.shift_count}</td>
                                        <td className="px-4 py-3 text-right">KES {parseFloat(user.expected_cash || 0).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">KES {parseFloat(user.actual_cash || 0).toLocaleString()}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${getVarianceClass(user.variance)}`}>
                                            KES {parseFloat(user.variance || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Shifts Table */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                    <h3 className="font-semibold">All Shifts</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Cashier</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Expected</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actual</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Variance</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center">
                                        <RefreshCw className="animate-spin mx-auto mb-2 text-gray-400" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : shifts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No shifts found</td>
                                </tr>
                            ) : (
                                shifts.map(shift => (
                                    <tr key={shift.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium">{shift.shift_date}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(shift.opening_time).toLocaleTimeString()}
                                                {shift.closing_time && ` - ${new Date(shift.closing_time).toLocaleTimeString()}`}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{shift.cashier_name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(shift.status)}`}>
                                                {shift.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            KES {parseFloat(shift.expected_cash || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            KES {parseFloat(shift.actual_cash || 0).toLocaleString()}
                                        </td>
                                        <td className={`px-4 py-3 text-right text-sm font-medium ${getVarianceClass(shift.cash_variance)}`}>
                                            KES {parseFloat(shift.cash_variance || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => viewShiftDetails(shift)}
                                                className="p-1 hover:bg-gray-100 rounded"
                                                title="View Details"
                                            >
                                                <Eye size={18} className="text-gray-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Shift Detail Modal */}
            {selectedShift && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedShift(null)}>
                    <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold">Shift Details</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedShift.status)}`}>
                                {selectedShift.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-sm text-gray-500">Cashier</label>
                                <p className="font-medium">{selectedShift.cashier_name}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Date</label>
                                <p className="font-medium">{selectedShift.shift_date}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Opening Time</label>
                                <p className="font-medium">{new Date(selectedShift.opening_time).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Closing Time</label>
                                <p className="font-medium">
                                    {selectedShift.closing_time ? new Date(selectedShift.closing_time).toLocaleString() : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-medium mb-3">Cash Summary</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-gray-500 text-sm">Expected</p>
                                    <p className="text-lg font-bold">KES {parseFloat(selectedShift.expected_cash || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Actual</p>
                                    <p className="text-lg font-bold">KES {parseFloat(selectedShift.actual_cash || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Variance</p>
                                    <p className={`text-lg font-bold ${getVarianceClass(selectedShift.cash_variance)}`}>
                                        KES {parseFloat(selectedShift.cash_variance || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {selectedShift.cashier_notes && (
                            <div className="mb-4">
                                <label className="text-sm text-gray-500">Cashier Notes</label>
                                <p className="bg-gray-50 p-3 rounded">{selectedShift.cashier_notes}</p>
                            </div>
                        )}

                        {shiftTransactions.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-medium mb-2">Transactions ({shiftTransactions.length})</h4>
                                <div className="max-h-60 overflow-y-auto border rounded">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Time</th>
                                                <th className="px-3 py-2 text-left">Type</th>
                                                <th className="px-3 py-2 text-left">Method</th>
                                                <th className="px-3 py-2 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {shiftTransactions.map(tx => (
                                                <tr key={tx.id}>
                                                    <td className="px-3 py-2">{new Date(tx.created_at).toLocaleTimeString()}</td>
                                                    <td className="px-3 py-2 capitalize">{tx.transaction_type}</td>
                                                    <td className="px-3 py-2 capitalize">{tx.payment_method}</td>
                                                    <td className="px-3 py-2 text-right">KES {parseFloat(tx.amount).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Verify/Dispute Buttons (for closed shifts only) */}
                        {selectedShift.status === 'closed' && (
                            <div className="flex gap-3 border-t pt-4">
                                <button
                                    onClick={() => handleVerify(selectedShift.id, 'verified')}
                                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    Verify
                                </button>
                                <button
                                    onClick={() => handleVerify(selectedShift.id, 'disputed')}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2"
                                >
                                    <XCircle size={18} />
                                    Dispute
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => setSelectedShift(null)}
                            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftReports;
