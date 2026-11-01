import React, { useState, useEffect } from 'react';
import {
    ScanLine,
    Plus,
    Search,
    Edit2,
    Trash2,
    Check,
    X,
    AlertCircle,
    Loader2,
    DollarSign,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RadiologyExamsManagement = () => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [notification, setNotification] = useState(null);

    const [formData, setFormData] = useState({
        exam_code: '',
        exam_name: '',
        category: 'xray',
        description: '',
        price: '',
        duration_minutes: '30',
        is_active: true
    });

    const categories = [
        { code: 'xray', name: 'X-Ray' },
        { code: 'ultrasound', name: 'Ultrasound' },
        { code: 'ct_scan', name: 'CT Scan' },
        { code: 'mri', name: 'MRI' },
        { code: 'ecg', name: 'ECG/EKG' },
        { code: 'mammogram', name: 'Mammogram' },
        { code: 'doppler', name: 'Doppler' },
        { code: 'fluoroscopy', name: 'Fluoroscopy' },
        { code: 'other', name: 'Other' }
    ];

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/exams`);
            const data = await response.json();
            if (data.success) {
                setExams(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingExam
                ? `${API_BASE_URL}/radiology/exams/${editingExam.id}`
                : `${API_BASE_URL}/radiology/exams`;

            const response = await authenticatedFetch(url, {
                method: editingExam ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                showNotification(editingExam ? 'Exam updated successfully' : 'Exam added successfully', 'success');
                closeModal();
                fetchExams();
            } else {
                showNotification(data.error || 'Failed to save exam', 'error');
            }
        } catch (error) {
            console.error('Error saving exam:', error);
            showNotification('Failed to save exam', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this exam type?')) return;

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/radiology/exams/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                showNotification('Exam deleted successfully', 'success');
                fetchExams();
            } else {
                showNotification(data.error || 'Failed to delete exam', 'error');
            }
        } catch (error) {
            console.error('Error deleting exam:', error);
            showNotification('Failed to delete exam', 'error');
        }
    };

    const openEditModal = (exam) => {
        setEditingExam(exam);
        setFormData({
            exam_code: exam.exam_code,
            exam_name: exam.exam_name,
            category: exam.category,
            description: exam.description || '',
            price: exam.price,
            duration_minutes: exam.duration_minutes || '30',
            is_active: exam.is_active
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditingExam(null);
        setFormData({
            exam_code: '',
            exam_name: '',
            category: 'xray',
            description: '',
            price: '',
            duration_minutes: '30',
            is_active: true
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingExam(null);
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const filteredExams = exams.filter(exam =>
        exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.exam_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedExams = categories.reduce((acc, cat) => {
        acc[cat.code] = filteredExams.filter(e => e.category === cat.code);
        return acc;
    }, {});

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
                        Radiology Exams Management
                    </h1>
                    <p className="text-gray-500 mt-1">Add, edit, or remove radiology exam types and set prices</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                    <Plus size={20} />
                    Add Exam Type
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium">Total Exams</p>
                            <p className="text-3xl font-bold text-blue-700 mt-1">{exams.length}</p>
                        </div>
                        <ScanLine className="text-blue-500" size={32} />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">Active Exams</p>
                            <p className="text-3xl font-bold text-green-700 mt-1">{exams.filter(e => e.is_active).length}</p>
                        </div>
                        <Check className="text-green-500" size={32} />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-600 text-sm font-medium">Categories</p>
                            <p className="text-3xl font-bold text-purple-700 mt-1">{new Set(exams.map(e => e.category)).size}</p>
                        </div>
                        <DollarSign className="text-purple-500" size={32} />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search exams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={fetchExams} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Exams Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Exam Name</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price (KES)</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                                        <p>Loading exams...</p>
                                    </td>
                                </tr>
                            ) : filteredExams.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <ScanLine className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p>No exams found matching your search</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredExams.map((exam) => (
                                    <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {exam.exam_code}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div>
                                                <p className="font-medium">{exam.exam_name}</p>
                                                {exam.description && (
                                                    <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">
                                                        {exam.description}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                                {categories.find(c => c.code === exam.category)?.name || exam.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {parseFloat(exam.price).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {exam.duration_minutes} min
                                        </td>
                                        <td className="px-6 py-4">
                                            {exam.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(exam)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exam.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingExam ? 'Edit Exam Type' : 'Add Exam Type'}
                            </h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Code *</label>
                                    <input
                                        type="text"
                                        value={formData.exam_code}
                                        onChange={(e) => setFormData({ ...formData, exam_code: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="e.g., XRAY_CHEST"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.code} value={cat.code}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                                <input
                                    type="text"
                                    value={formData.exam_name}
                                    onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                                    required
                                    placeholder="e.g., Chest X-Ray PA View"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    placeholder="Brief description of the exam..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        min="0"
                                        step="0.01"
                                        placeholder="e.g., 1500"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        value={formData.duration_minutes}
                                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                                        min="1"
                                        placeholder="e.g., 30"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-700">Active (available for ordering)</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                                >
                                    {editingExam ? 'Update Exam' : 'Add Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RadiologyExamsManagement;
