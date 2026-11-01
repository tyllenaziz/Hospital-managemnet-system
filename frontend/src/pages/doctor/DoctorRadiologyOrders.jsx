import React, { useState, useEffect } from 'react';
import {
    ScanLine,
    Plus,
    Search,
    User,
    Clock,
    Check,
    AlertCircle,
    Loader2,
    X,
    FileText,
    Eye,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DoctorRadiologyOrders = () => {
    const { authenticatedFetch, API_BASE_URL, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null);

    // Form state for new order
    const [orderForm, setOrderForm] = useState({
        patient_id: '',
        imaging_type: 'xray',
        body_part: '',
        priority: 'routine',
        clinical_indication: '',
        notes: ''
    });

    const imagingTypes = [
        { code: 'xray', name: 'X-Ray', icon: '🔬' },
        { code: 'ultrasound', name: 'Ultrasound', icon: '📡' },
        { code: 'ct_scan', name: 'CT Scan', icon: '🔄' },
        { code: 'mri', name: 'MRI', icon: '🧲' },
        { code: 'ecg', name: 'ECG', icon: '💓' },
        { code: 'mammogram', name: 'Mammogram', icon: '👩‍⚕️' },
        { code: 'doppler', name: 'Doppler', icon: '🌊' }
    ];

    const bodyParts = [
        'Chest', 'Abdomen', 'Head/Brain', 'Spine', 'Pelvis',
        'Upper Limb', 'Lower Limb', 'Heart', 'Neck', 'Dental',
        'Breast', 'Thyroid', 'Kidney', 'Liver', 'Other'
    ];

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        scheduled: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-purple-100 text-purple-800',
        completed: 'bg-green-100 text-green-800',
        reported: 'bg-emerald-100 text-emerald-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    useEffect(() => {
        fetchOrders();
        fetchPatients();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/doctor-orders`);
            const data = await response.json();
            if (data.success) {
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/patients`);
            const data = await response.json();
            if (data.success) {
                setPatients(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...orderForm,
                    ordering_doctor_id: user?.id
                })
            });

            const data = await response.json();
            if (data.success) {
                showNotification('Radiology order created successfully', 'success');
                setShowNewOrderModal(false);
                setOrderForm({
                    patient_id: '',
                    imaging_type: 'xray',
                    body_part: '',
                    priority: 'routine',
                    clinical_indication: '',
                    notes: ''
                });
                fetchOrders();
            } else {
                showNotification(data.error || 'Failed to create order', 'error');
            }
        } catch (error) {
            showNotification('Failed to create order', 'error');
        }
    };

    const viewResults = (order) => {
        setSelectedOrder(order);
        setShowResultsModal(true);
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredOrders = orders.filter(order => {
        if (filter !== 'all' && order.status !== filter) return false;
        if (searchQuery && !order.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const inProgressCount = orders.filter(o => o.status === 'in_progress').length;
    const completedCount = orders.filter(o => ['completed', 'reported'].includes(o.status)).length;

    return (
        <div className="p-6 space-y-6">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ScanLine className="text-blue-600" />
                        Radiology Orders
                    </h1>
                    <p className="text-gray-500 mt-1">Order X-Ray, Ultrasound, CT, MRI, ECG and other imaging tests</p>
                </div>
                <button
                    onClick={() => setShowNewOrderModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                    <Plus size={20} />
                    New Order
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-600 text-sm font-medium">Pending</p>
                            <p className="text-3xl font-bold text-yellow-700 mt-1">{pendingCount}</p>
                        </div>
                        <Clock className="text-yellow-500" size={32} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-600 text-sm font-medium">In Progress</p>
                            <p className="text-3xl font-bold text-purple-700 mt-1">{inProgressCount}</p>
                        </div>
                        <ScanLine className="text-purple-500" size={32} />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">Completed</p>
                            <p className="text-3xl font-bold text-green-700 mt-1">{completedCount}</p>
                        </div>
                        <Check className="text-green-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search patient..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'in_progress', 'completed', 'reported'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchOrders} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <ScanLine className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No radiology orders found</p>
                        <button
                            onClick={() => setShowNewOrderModal(true)}
                            className="mt-4 text-blue-600 hover:underline"
                        >
                            Create your first order
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Patient</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Imaging Type</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Body Part</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Priority</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User size={16} className="text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">{order.patient_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                                                {imagingTypes.find(t => t.code === order.imaging_type)?.name || order.imaging_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{order.body_part || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${order.priority === 'stat' ? 'bg-red-100 text-red-800' :
                                                    order.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-100'}`}>
                                                {order.status?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {['completed', 'reported'].includes(order.status) ? (
                                                <button
                                                    onClick={() => viewResults(order)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                                                >
                                                    <Eye size={16} /> View Results
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Awaiting results</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* New Order Modal */}
            {showNewOrderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">New Radiology Order</h2>
                            <button onClick={() => setShowNewOrderModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitOrder} className="p-6 space-y-4">
                            {/* Patient Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                                <select
                                    value={orderForm.patient_id}
                                    onChange={(e) => setOrderForm({ ...orderForm, patient_id: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.patient_number}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Imaging Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imaging Type *</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {imagingTypes.map(type => (
                                        <button
                                            key={type.code}
                                            type="button"
                                            onClick={() => setOrderForm({ ...orderForm, imaging_type: type.code })}
                                            className={`p-3 border rounded-xl text-center transition-colors ${orderForm.imaging_type === type.code
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className="text-2xl block mb-1">{type.icon}</span>
                                            <span className="text-sm">{type.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Body Part */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Body Part *</label>
                                <select
                                    value={orderForm.body_part}
                                    onChange={(e) => setOrderForm({ ...orderForm, body_part: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select body part</option>
                                    {bodyParts.map(part => (
                                        <option key={part} value={part}>{part}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <div className="flex gap-2">
                                    {['routine', 'urgent', 'stat'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setOrderForm({ ...orderForm, priority: p })}
                                            className={`flex-1 py-2 rounded-lg border capitalize transition-colors ${orderForm.priority === p
                                                    ? p === 'stat' ? 'border-red-500 bg-red-50 text-red-700' :
                                                        p === 'urgent' ? 'border-orange-500 bg-orange-50 text-orange-700' :
                                                            'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Clinical Indication */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Indication *</label>
                                <textarea
                                    value={orderForm.clinical_indication}
                                    onChange={(e) => setOrderForm({ ...orderForm, clinical_indication: e.target.value })}
                                    required
                                    rows={3}
                                    placeholder="Reason for imaging, suspected diagnosis..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                                <textarea
                                    value={orderForm.notes}
                                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                    rows={2}
                                    placeholder="Any special instructions..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewOrderModal(false)}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                                >
                                    Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Results Modal */}
            {showResultsModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Radiology Results</h2>
                            <button onClick={() => setShowResultsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Patient</p>
                                    <p className="font-medium">{selectedOrder.patient_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Imaging Type</p>
                                    <p className="font-medium">{selectedOrder.imaging_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Body Part</p>
                                    <p className="font-medium">{selectedOrder.body_part}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Performed By</p>
                                    <p className="font-medium">{selectedOrder.performed_by_name || 'N/A'}</p>
                                </div>
                            </div>

                            {selectedOrder.findings && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Findings</p>
                                    <div className="bg-gray-50 rounded-lg p-4 border">
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedOrder.findings}</p>
                                    </div>
                                </div>
                            )}

                            {selectedOrder.impression && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Impression</p>
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <p className="text-blue-800 whitespace-pre-wrap">{selectedOrder.impression}</p>
                                    </div>
                                </div>
                            )}

                            {selectedOrder.recommendations && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Recommendations</p>
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                        <p className="text-green-800 whitespace-pre-wrap">{selectedOrder.recommendations}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                                >
                                    Print Results
                                </button>
                                <button
                                    onClick={() => setShowResultsModal(false)}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorRadiologyOrders;
