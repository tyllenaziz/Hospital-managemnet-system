import React, { useState, useEffect } from 'react';
import {
    DollarSign, Clock, Play, Square, RefreshCw, Plus, Minus,
    CheckCircle, AlertTriangle, CreditCard, Smartphone, Banknote,
    FileText, TrendingUp, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const ShiftManagement = () => {
    const { authenticatedFetch, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentShift, setCurrentShift] = useState(null);
    const [hasOpenShift, setHasOpenShift] = useState(false);
    const [transactions, setTransactions] = useState([]);

    // Modals
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showFloatModal, setShowFloatModal] = useState(false);

    // Form data
    const [openingBalance, setOpeningBalance] = useState('');
    const [closeData, setCloseData] = useState({
        actual_cash: '',
        actual_mpesa: '',
        actual_card: '',
        cashier_notes: ''
    });
    const [floatData, setFloatData] = useState({ amount: '', type: 'in', description: '' });

    useEffect(() => {
        fetchCurrentShift();
    }, []);

    const fetchCurrentShift = async () => {
        try {
            setLoading(true);
            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/shift/current`);
            const data = await response.json();

            if (data.success) {
                setHasOpenShift(data.hasOpenShift);
                setCurrentShift(data.shift);
                if (data.shift) {
                    fetchTransactions(data.shift.id);
                }
            }
        } catch (error) {
            console.error('Error fetching shift:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async (shiftId) => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/shift/${shiftId}/transactions`);
            const data = await response.json();
            if (data.success) {
                setTransactions(data.transactions);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handleOpenShift = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/shift/open`, {
                method: 'POST',
                body: JSON.stringify({ opening_balance: parseFloat(openingBalance) || 0 })
            });
            const data = await response.json();

            if (data.success) {
                setShowOpenModal(false);
                setOpeningBalance('');
                fetchCurrentShift();
            } else {
                alert(data.error || 'Failed to open shift');
            }
        } catch (error) {
            console.error('Error opening shift:', error);
            alert('Failed to open shift');
        }
    };

    const handleCloseShift = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/shift/close`, {
                method: 'POST',
                body: JSON.stringify(closeData)
            });
            const data = await response.json();

            if (data.success) {
                setShowCloseModal(false);
                setCloseData({ actual_cash: '', actual_mpesa: '', actual_card: '', cashier_notes: '' });
                alert(`Shift closed successfully!\n\nVariance: KES ${data.summary.cash_variance}\nStatus: ${data.summary.variance_status}`);
                fetchCurrentShift();
            } else {
                alert(data.error || 'Failed to close shift');
            }
        } catch (error) {
            console.error('Error closing shift:', error);
            alert('Failed to close shift');
        }
    };

    const handleAddFloat = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/cashier/float`, {
                method: 'POST',
                body: JSON.stringify(floatData)
            });
            const data = await response.json();

            if (data.success) {
                setShowFloatModal(false);
                setFloatData({ amount: '', type: 'in', description: '' });
                fetchCurrentShift();
            } else {
                alert(data.error || 'Failed to add float');
            }
        } catch (error) {
            console.error('Error adding float:', error);
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
        <div className="bg-white rounded-xl p-4 shadow border">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-xl font-bold">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to={`/${user?.role}/dashboard`} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <DollarSign className="text-green-600" />
                            Shift Management
                        </h1>
                        <p className="text-gray-600">
                            {hasOpenShift ? 'Manage your current shift' : 'Open a shift to start collecting payments'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchCurrentShift}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {/* No Open Shift */}
            {!hasOpenShift && (
                <div className="bg-white rounded-2xl p-8 shadow border text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={40} className="text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Open Shift</h2>
                    <p className="text-gray-600 mb-6">You need to open a shift before you can process payments</p>
                    <button
                        onClick={() => setShowOpenModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl mx-auto font-semibold"
                    >
                        <Play size={20} />
                        Open New Shift
                    </button>
                </div>
            )}

            {/* Current Shift */}
            {hasOpenShift && currentShift && (
                <>
                    {/* Shift Info */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={24} />
                                    <span className="text-lg font-semibold">Shift Active</span>
                                </div>
                                <p className="text-green-100">Started: {new Date(currentShift.opening_time).toLocaleString()}</p>
                                <p className="text-green-100">Opening Balance: KES {parseFloat(currentShift.opening_balance).toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => setShowCloseModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg"
                            >
                                <Square size={18} />
                                Close Shift
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={Banknote}
                            title="Expected Cash"
                            value={`KES ${(currentShift.expected_cash || 0).toLocaleString()}`}
                            subtitle="Including float"
                            color="bg-green-600"
                        />
                        <StatCard
                            icon={Smartphone}
                            title="M-Pesa"
                            value={`KES ${(currentShift.expected_mpesa || 0).toLocaleString()}`}
                            color="bg-emerald-600"
                        />
                        <StatCard
                            icon={CreditCard}
                            title="Card Payments"
                            value={`KES ${(currentShift.expected_card || 0).toLocaleString()}`}
                            color="bg-blue-600"
                        />
                        <StatCard
                            icon={TrendingUp}
                            title="Total Collected"
                            value={`KES ${(currentShift.total_payments || 0).toLocaleString()}`}
                            subtitle={`${transactions.length} transactions`}
                            color="bg-purple-600"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => { setFloatData({ ...floatData, type: 'in' }); setShowFloatModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg"
                        >
                            <Plus size={18} />
                            Add Float
                        </button>
                        <button
                            onClick={() => { setFloatData({ ...floatData, type: 'out' }); setShowFloatModal(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg"
                        >
                            <Minus size={18} />
                            Remove Float
                        </button>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white rounded-xl shadow border overflow-hidden">
                        <div className="px-4 py-3 border-b bg-gray-50">
                            <h3 className="font-semibold flex items-center gap-2">
                                <FileText size={18} />
                                Shift Transactions
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Payment</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Patient</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                No transactions yet
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(tx.created_at).toLocaleTimeString()}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.transaction_type === 'payment' ? 'bg-green-100 text-green-700' :
                                                            tx.transaction_type === 'refund' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {tx.transaction_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm capitalize">{tx.payment_method}</td>
                                                <td className={`px-4 py-3 text-sm font-medium text-right ${tx.transaction_type === 'refund' || tx.transaction_type === 'float_out'
                                                        ? 'text-red-600' : 'text-green-600'
                                                    }`}>
                                                    {tx.transaction_type === 'refund' || tx.transaction_type === 'float_out' ? '-' : '+'}
                                                    KES {parseFloat(tx.amount).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{tx.patient_name || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {tx.reference_type ? `${tx.reference_type} #${tx.reference_id}` : tx.description || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Open Shift Modal */}
            {showOpenModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Open New Shift</h3>
                        <p className="text-gray-600 mb-4">Enter your opening cash balance to start the shift.</p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance (KES)</label>
                            <input
                                type="number"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-3 border rounded-lg text-lg"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowOpenModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleOpenShift}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                            >
                                Open Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Shift Modal */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Close Shift</h3>
                        <p className="text-gray-600 mb-4">Enter your actual cash counts to reconcile.</p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="font-medium mb-2">Expected Amounts</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Cash</p>
                                    <p className="font-bold">KES {(currentShift?.expected_cash || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">M-Pesa</p>
                                    <p className="font-bold">KES {(currentShift?.expected_mpesa || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Card</p>
                                    <p className="font-bold">KES {(currentShift?.expected_card || 0).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cash (KES)</label>
                                <input
                                    type="number"
                                    value={closeData.actual_cash}
                                    onChange={(e) => setCloseData({ ...closeData, actual_cash: e.target.value })}
                                    placeholder="Count your cash..."
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Actual M-Pesa (KES)</label>
                                <input
                                    type="number"
                                    value={closeData.actual_mpesa}
                                    onChange={(e) => setCloseData({ ...closeData, actual_mpesa: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea
                                    value={closeData.cashier_notes}
                                    onChange={(e) => setCloseData({ ...closeData, cashier_notes: e.target.value })}
                                    placeholder="Any notes about this shift..."
                                    className="w-full px-4 py-2 border rounded-lg"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCloseShift}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                                Close Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Float Modal */}
            {showFloatModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">
                            {floatData.type === 'in' ? 'Add Cash Float' : 'Remove Cash Float'}
                        </h3>
                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                                <input
                                    type="number"
                                    value={floatData.amount}
                                    onChange={(e) => setFloatData({ ...floatData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={floatData.description}
                                    onChange={(e) => setFloatData({ ...floatData, description: e.target.value })}
                                    placeholder="e.g., Getting change..."
                                    className="w-full px-4 py-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFloatModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddFloat}
                                className={`flex-1 px-4 py-2 text-white rounded-lg ${floatData.type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                {floatData.type === 'in' ? 'Add Float' : 'Remove Float'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftManagement;
