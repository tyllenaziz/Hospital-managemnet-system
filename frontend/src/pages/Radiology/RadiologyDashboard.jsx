import React, { useState, useEffect } from 'react';
import {
    ScanLine,
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    User,
    FileText,
    Image,
    ChevronDown,
    Loader2,
    Check,
    AlertCircle,
    X,
    Eye,
    Edit2,
    Printer,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RadiologyDashboard = () => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [orders, setOrders] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const imagingTypes = [
        { code: 'xray', name: 'X-Ray', color: 'blue' },
        { code: 'ultrasound', name: 'Ultrasound', color: 'purple' },
        { code: 'ct_scan', name: 'CT Scan', color: 'orange' },
        { code: 'mri', name: 'MRI', color: 'red' },
        { code: 'ecg', name: 'ECG', color: 'green' },
        { code: 'doppler', name: 'Doppler', color: 'teal' }
    ];

    const statusColors = {
        ordered: 'bg-yellow-100 text-yellow-800',
        scheduled: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-purple-100 text-purple-800',
        completed: 'bg-green-100 text-green-800',
        reported: 'bg-emerald-100 text-emerald-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    const priorityColors = {
        routine: 'bg-gray-100 text-gray-800',
        urgent: 'bg-orange-100 text-orange-800',
        stat: 'bg-red-100 text-red-800'
    };

    useEffect(() => {
        fetchOrders();
        fetchExams();
    }, [filter, typeFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/pending`);
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

    const fetchExams = async () => {
        // This would fetch exam types - for now use static data
        setExams([
            { id: 1, code: 'XR-CHEST', name: 'Chest X-Ray', type: 'xray', price: 1500 },
            { id: 2, code: 'US-ABD', name: 'Abdominal Ultrasound', type: 'ultrasound', price: 3000 },
            { id: 3, code: 'ECG-12', name: '12-Lead ECG', type: 'ecg', price: 1000 }
        ]);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // API call to update status
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: newStatus } : o
            ));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filter !== 'all' && order.status !== filter) return false;
        if (typeFilter !== 'all' && order.xray_type !== typeFilter) return false;
        if (searchQuery && !order.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        inProgress: orders.filter(o => o.status === 'in_progress').length,
        completed: orders.filter(o => o.status === 'completed' || o.status === 'reported').length,
        today: orders.filter(o => {
            const today = new Date().toDateString();
            return new Date(o.request_date).toDateString() === today;
        }).length
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ScanLine className="text-blue-600" />
                        Radiology & Imaging
                    </h1>
                    <p className="text-gray-500 mt-1">X-Ray, Ultrasound, CT Scan, MRI, ECG</p>
                </div>
                <button
                    onClick={() => setShowNewOrderModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                    <Plus size={20} />
                    New Order
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-600 text-sm font-medium">Pending</p>
                            <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
                        </div>
                        <div className="p-3 bg-yellow-200 rounded-lg">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-600 text-sm font-medium">In Progress</p>
                            <p className="text-3xl font-bold text-purple-700 mt-1">{stats.inProgress}</p>
                        </div>
                        <div className="p-3 bg-purple-200 rounded-lg">
                            <ScanLine className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">Completed</p>
                            <p className="text-3xl font-bold text-green-700 mt-1">{stats.completed}</p>
                        </div>
                        <div className="p-3 bg-green-200 rounded-lg">
                            <Check className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium">Today's Orders</p>
                            <p className="text-3xl font-bold text-blue-700 mt-1">{stats.today}</p>
                        </div>
                        <div className="p-3 bg-blue-200 rounded-lg">
                            <Calendar className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Imaging Type Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Imaging Type:</span>
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === 'all'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All Types
                    </button>
                    {imagingTypes.map(type => (
                        <button
                            key={type.code}
                            onClick={() => setTypeFilter(type.code)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${typeFilter === type.code
                                    ? `bg-${type.color}-600 text-white`
                                    : `bg-${type.color}-50 text-${type.color}-700 hover:bg-${type.color}-100`
                                }`}
                        >
                            {type.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by patient name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'in_progress', 'completed', 'reported'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${filter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Orders List */}
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
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Order #</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Patient</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Examination</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Body Part</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Priority</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-sm text-gray-900">#{order.id}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User size={16} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{order.patient_name}</p>
                                                    <p className="text-xs text-gray-500">{order.age} yrs, {order.gender}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <ScanLine size={16} className="text-blue-500" />
                                                <span className="text-gray-900">{order.xray_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700">{order.body_part || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[order.priority] || priorityColors.routine}`}>
                                                {order.priority || 'Routine'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status?.replace('_', ' ') || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {order.request_date ? new Date(order.request_date).toLocaleDateString() : '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Print Report"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Order Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
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
                                    <p className="text-sm text-gray-500">Examination</p>
                                    <p className="font-medium">{selectedOrder.xray_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Body Part</p>
                                    <p className="font-medium">{selectedOrder.body_part || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Priority</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[selectedOrder.priority]}`}>
                                        {selectedOrder.priority}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Ordered By</p>
                                    <p className="font-medium">{selectedOrder.doctor_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                                        {selectedOrder.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {selectedOrder.reason && (
                                <div>
                                    <p className="text-sm text-gray-500">Clinical Indication</p>
                                    <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrder.reason}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                {selectedOrder.status === 'pending' && (
                                    <button
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'in_progress')}
                                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Start Processing
                                    </button>
                                )}
                                {selectedOrder.status === 'in_progress' && (
                                    <button
                                        onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Mark Complete
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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

export default RadiologyDashboard;
