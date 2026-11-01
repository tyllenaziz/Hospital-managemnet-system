import React, { useState, useEffect } from 'react';
import {
    ScanLine,
    Search,
    User,
    Clock,
    Check,
    AlertCircle,
    Loader2,
    X,
    FileText,
    Printer,
    Send,
    RefreshCw,
    Filter,
    UserPlus,
    Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RadiologistWorkstation = () => {
    const { authenticatedFetch, API_BASE_URL, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [showExternalModal, setShowExternalModal] = useState(false);
    const [filter, setFilter] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null);

    // Results form state
    const [resultsForm, setResultsForm] = useState({
        findings: '',
        impression: '',
        recommendations: '',
        status: 'completed'
    });

    // External patient form
    const [externalForm, setExternalForm] = useState({
        patient_name: '',
        phone: '',
        age: '',
        gender: 'male',
        referring_hospital: '',
        imaging_type: 'xray',
        body_part: '',
        clinical_indication: ''
    });

    const imagingTypes = [
        { code: 'xray', name: 'X-Ray' },
        { code: 'ultrasound', name: 'Ultrasound' },
        { code: 'ct_scan', name: 'CT Scan' },
        { code: 'mri', name: 'MRI' },
        { code: 'ecg', name: 'ECG' },
        { code: 'mammogram', name: 'Mammogram' },
        { code: 'doppler', name: 'Doppler' }
    ];

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
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
    }, [filter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/pending`);
            const data = await response.json();
            if (data.success) {
                let filtered = data.data || [];
                if (filter !== 'all') {
                    filtered = filtered.filter(o => o.status === filter);
                }
                setOrders(filtered);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const startProcessing = (order) => {
        setSelectedOrder(order);
        setResultsForm({
            findings: '',
            impression: '',
            recommendations: '',
            status: 'completed'
        });
        setShowProcessModal(true);

        // Mark as in_progress
        updateOrderStatus(order.id, 'in_progress');
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await authenticatedFetch(`${API_BASE_URL}/radiology/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const submitResults = async (e) => {
        e.preventDefault();
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/orders/${selectedOrder.id}/results`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...resultsForm,
                    performed_by_id: user?.id,
                    performed_at: new Date().toISOString()
                })
            });

            const data = await response.json();
            if (data.success) {
                showNotification('Results submitted successfully', 'success');
                setShowProcessModal(false);
                setSelectedOrder(null);
                fetchOrders();
            } else {
                showNotification(data.error || 'Failed to submit results', 'error');
            }
        } catch (error) {
            showNotification('Failed to submit results', 'error');
        }
    };

    const registerExternalPatient = async (e) => {
        e.preventDefault();
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/external-patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...externalForm,
                    is_external: true,
                    performed_by_id: user?.id
                })
            });

            const data = await response.json();
            if (data.success) {
                showNotification('External patient registered successfully', 'success');
                setShowExternalModal(false);
                setExternalForm({
                    patient_name: '',
                    phone: '',
                    age: '',
                    gender: 'male',
                    referring_hospital: '',
                    imaging_type: 'xray',
                    body_part: '',
                    clinical_indication: ''
                });
                fetchOrders();
            } else {
                showNotification(data.error || 'Failed to register patient', 'error');
            }
        } catch (error) {
            showNotification('Failed to register patient', 'error');
        }
    };

    const printResults = (order) => {
        // Open print dialog with results
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
      <html>
        <head>
          <title>Radiology Report - ${order.patient_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #374151; }
            .value { margin-top: 5px; padding: 10px; background: #f3f4f6; border-radius: 8px; }
            .header { border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Radiology Report</h1>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="section">
            <p><span class="label">Patient:</span> ${order.patient_name}</p>
            <p><span class="label">Imaging Type:</span> ${order.imaging_type}</p>
            <p><span class="label">Body Part:</span> ${order.body_part || 'N/A'}</p>
          </div>
          <div class="section">
            <p class="label">Findings:</p>
            <div class="value">${order.findings || 'No findings recorded'}</div>
          </div>
          <div class="section">
            <p class="label">Impression:</p>
            <div class="value">${order.impression || 'No impression recorded'}</div>
          </div>
          <div class="section">
            <p class="label">Recommendations:</p>
            <div class="value">${order.recommendations || 'No recommendations'}</div>
          </div>
          <div class="footer">
            <p><strong>Performed by:</strong> ${user?.username || 'Radiologist'}</p>
            <p><strong>Report generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const sendToDoctor = async (order) => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/orders/${order.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'reported' })
            });

            const data = await response.json();
            if (data.success) {
                showNotification('Results sent to doctor', 'success');
                fetchOrders();
            }
        } catch (error) {
            showNotification('Failed to send results', 'error');
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredOrders = orders.filter(order => {
        if (searchQuery && !order.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        inProgress: orders.filter(o => o.status === 'in_progress').length,
        completed: orders.filter(o => ['completed', 'reported'].includes(o.status)).length
    };

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
                        Radiology Workstation
                    </h1>
                    <p className="text-gray-500 mt-1">Process imaging orders and submit results</p>
                </div>
                <button
                    onClick={() => setShowExternalModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                    <UserPlus size={20} />
                    External Patient
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                    onClick={() => setFilter('pending')}
                    className={`cursor-pointer bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5 border ${filter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-yellow-200'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-600 text-sm font-medium">Pending</p>
                            <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
                        </div>
                        <Clock className="text-yellow-500" size={32} />
                    </div>
                </div>

                <div
                    onClick={() => setFilter('in_progress')}
                    className={`cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border ${filter === 'in_progress' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-200'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-600 text-sm font-medium">In Progress</p>
                            <p className="text-3xl font-bold text-purple-700 mt-1">{stats.inProgress}</p>
                        </div>
                        <ScanLine className="text-purple-500" size={32} />
                    </div>
                </div>

                <div
                    onClick={() => setFilter('completed')}
                    className={`cursor-pointer bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border ${filter === 'completed' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">Completed</p>
                            <p className="text-3xl font-bold text-green-700 mt-1">{stats.completed}</p>
                        </div>
                        <Check className="text-green-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Search and Refresh */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
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
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    All
                </button>
                <button onClick={fetchOrders} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <RefreshCw size={20} />
                </button>
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
                        <p className="text-gray-500">No orders found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${order.is_external ? 'bg-purple-100' : 'bg-blue-100'
                                            }`}>
                                            {order.is_external ? (
                                                <Building size={24} className="text-purple-600" />
                                            ) : (
                                                <User size={24} className="text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{order.patient_name}</h3>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-sm">
                                                    {imagingTypes.find(t => t.code === order.imaging_type)?.name}
                                                </span>
                                                <span className="text-gray-500 text-sm">{order.body_part}</span>
                                                {order.is_external && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                                        External: {order.referring_hospital}
                                                    </span>
                                                )}
                                            </div>
                                            {order.clinical_indication && (
                                                <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                                    {order.clinical_indication}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[order.priority] || priorityColors.routine}`}>
                                                {order.priority}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status]}`}>
                                                {order.status?.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="flex gap-2 mt-2">
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => startProcessing(order)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                >
                                                    <ScanLine size={16} /> Process
                                                </button>
                                            )}
                                            {order.status === 'in_progress' && (
                                                <button
                                                    onClick={() => startProcessing(order)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                                >
                                                    <FileText size={16} /> Enter Results
                                                </button>
                                            )}
                                            {order.status === 'completed' && (
                                                <>
                                                    <button
                                                        onClick={() => sendToDoctor(order)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                                    >
                                                        <Send size={16} /> Send to Doctor
                                                    </button>
                                                    <button
                                                        onClick={() => printResults(order)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                                                    >
                                                        <Printer size={16} /> Print
                                                    </button>
                                                </>
                                            )}
                                            {order.status === 'reported' && (
                                                <button
                                                    onClick={() => printResults(order)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                                                >
                                                    <Printer size={16} /> Print Copy
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Process/Results Modal */}
            {showProcessModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Enter Results</h2>
                                <p className="text-gray-500 text-sm">{selectedOrder.patient_name} - {selectedOrder.imaging_type}</p>
                            </div>
                            <button onClick={() => setShowProcessModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={submitResults} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Findings *</label>
                                <textarea
                                    value={resultsForm.findings}
                                    onChange={(e) => setResultsForm({ ...resultsForm, findings: e.target.value })}
                                    required
                                    rows={4}
                                    placeholder="Describe the imaging findings..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Impression *</label>
                                <textarea
                                    value={resultsForm.impression}
                                    onChange={(e) => setResultsForm({ ...resultsForm, impression: e.target.value })}
                                    required
                                    rows={3}
                                    placeholder="Radiologist impression/interpretation..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
                                <textarea
                                    value={resultsForm.recommendations}
                                    onChange={(e) => setResultsForm({ ...resultsForm, recommendations: e.target.value })}
                                    rows={2}
                                    placeholder="Any follow-up recommendations..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowProcessModal(false)}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                                >
                                    Submit Results
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* External Patient Modal */}
            {showExternalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Register External Patient</h2>
                                <p className="text-gray-500 text-sm">Patient from another hospital</p>
                            </div>
                            <button onClick={() => setShowExternalModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={registerExternalPatient} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                                    <input
                                        type="text"
                                        value={externalForm.patient_name}
                                        onChange={(e) => setExternalForm({ ...externalForm, patient_name: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={externalForm.phone}
                                        onChange={(e) => setExternalForm({ ...externalForm, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        value={externalForm.age}
                                        onChange={(e) => setExternalForm({ ...externalForm, age: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select
                                        value={externalForm.gender}
                                        onChange={(e) => setExternalForm({ ...externalForm, gender: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Referring Hospital *</label>
                                <input
                                    type="text"
                                    value={externalForm.referring_hospital}
                                    onChange={(e) => setExternalForm({ ...externalForm, referring_hospital: e.target.value })}
                                    required
                                    placeholder="Hospital name that referred the patient"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Imaging Type *</label>
                                    <select
                                        value={externalForm.imaging_type}
                                        onChange={(e) => setExternalForm({ ...externalForm, imaging_type: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {imagingTypes.map(t => (
                                            <option key={t.code} value={t.code}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
                                    <input
                                        type="text"
                                        value={externalForm.body_part}
                                        onChange={(e) => setExternalForm({ ...externalForm, body_part: e.target.value })}
                                        placeholder="e.g., Chest, Abdomen..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Indication</label>
                                <textarea
                                    value={externalForm.clinical_indication}
                                    onChange={(e) => setExternalForm({ ...externalForm, clinical_indication: e.target.value })}
                                    rows={2}
                                    placeholder="Reason for imaging..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowExternalModal(false)}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                                >
                                    Register & Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RadiologistWorkstation;
