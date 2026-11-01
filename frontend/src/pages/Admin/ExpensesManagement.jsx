import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Wallet,
    Plus,
    Search,
    Filter,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Download,
    Eye,
    Edit2,
    Trash2,
    RefreshCw,
    Users,
    Zap,
    Briefcase,
    Building,
    Package,
    Fuel,
    Wifi,
    Wrench,
    ChevronDown,
    ChevronUp,
    X,
    Check,
    AlertCircle
} from 'lucide-react';
import { useAuth, API_ENDPOINTS } from '../../context/AuthContext';

const ExpensesManagement = () => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const location = useLocation();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [stats, setStats] = useState({
        totalExpenses: 0,
        monthlyExpenses: 0,
        pendingPayments: 0,
        byCategory: {}
    });
    const [sortConfig, setSortConfig] = useState({ key: 'expense_date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'misc',
        paid_to: '',
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [users, setUsers] = useState([]);

    const categories = [
        { value: 'doctor_salary', label: 'Doctor Salary', icon: Users, color: 'bg-blue-500' },
        { value: 'staff_payment', label: 'Staff Payment', icon: Briefcase, color: 'bg-green-500' },
        { value: 'utilities', label: 'Utilities', icon: Zap, color: 'bg-yellow-500' },
        { value: 'medical_supplies', label: 'Medical Supplies', icon: Package, color: 'bg-purple-500' },
        { value: 'equipment', label: 'Equipment', icon: Wrench, color: 'bg-orange-500' },
        { value: 'rent', label: 'Rent', icon: Building, color: 'bg-indigo-500' },
        { value: 'fuel', label: 'Fuel/Transport', icon: Fuel, color: 'bg-red-500' },
        { value: 'internet', label: 'Internet/Communication', icon: Wifi, color: 'bg-teal-500' },
        { value: 'misc', label: 'Miscellaneous', icon: DollarSign, color: 'bg-gray-500' }
    ];

    // Set category filter based on URL path
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/salaries')) {
            setCategoryFilter('salary'); // Will match doctor_salary and staff_payment
        } else if (path.includes('/utilities')) {
            setCategoryFilter('utilities');
        } else if (path.includes('/supplies')) {
            setCategoryFilter('medical_supplies');
        } else {
            setCategoryFilter('all');
        }
    }, [location.pathname]);

    useEffect(() => {
        fetchExpenses();
        fetchUsers();
    }, []);

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
    };

    const fetchUsers = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await authenticatedFetch(`${API_BASE_URL}/expenses`);
            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
                calculateStats(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            showNotification('error', 'Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (expensesData) => {
        const total = expensesData.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthly = expensesData.filter(exp => {
            const expDate = new Date(exp.expense_date);
            return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        }).reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

        const byCategory = expensesData.reduce((acc, exp) => {
            const cat = exp.category || 'misc';
            acc[cat] = (acc[cat] || 0) + parseFloat(exp.amount || 0);
            return acc;
        }, {});

        setStats({
            totalExpenses: total,
            monthlyExpenses: monthly,
            pendingPayments: 0,
            byCategory
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);

        try {
            const url = showEditModal
                ? `${API_BASE_URL}/expenses/${selectedExpense.id}`
                : `${API_BASE_URL}/expenses`;

            const method = showEditModal ? 'PUT' : 'POST';

            const response = await authenticatedFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showNotification('success', showEditModal ? 'Expense updated successfully' : 'Expense added successfully');
                fetchExpenses();
                closeModals();
            } else {
                throw new Error('Failed to save expense');
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            showNotification('error', 'Failed to save expense');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/expenses/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('success', 'Expense deleted successfully');
                fetchExpenses();
            } else {
                throw new Error('Failed to delete expense');
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            showNotification('error', 'Failed to delete expense');
        }
    };

    const openEditModal = (expense) => {
        setSelectedExpense(expense);
        setFormData({
            title: expense.title || '',
            amount: expense.amount || '',
            category: expense.category || 'misc',
            paid_to: expense.paid_to || '',
            expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
            description: expense.description || ''
        });
        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedExpense(null);
        setFormData({
            title: '',
            amount: '',
            category: 'misc',
            paid_to: '',
            expense_date: new Date().toISOString().split('T')[0],
            description: ''
        });
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Filter and sort expenses
    const filteredExpenses = expenses
        .filter(exp => {
            const matchesSearch =
                exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.paid_to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.description?.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
            // Special case for salary filter - match both doctor_salary and staff_payment
            if (categoryFilter === 'salary') {
                matchesCategory = exp.category === 'doctor_salary' || exp.category === 'staff_payment';
            }

            let matchesDate = true;
            if (dateRange.start && dateRange.end) {
                const expDate = new Date(exp.expense_date);
                matchesDate = expDate >= new Date(dateRange.start) && expDate <= new Date(dateRange.end);
            }

            return matchesSearch && matchesCategory && matchesDate;
        })
        .sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (sortConfig.key === 'amount') {
                return sortConfig.direction === 'asc'
                    ? parseFloat(aVal) - parseFloat(bVal)
                    : parseFloat(bVal) - parseFloat(aVal);
            }

            if (sortConfig.direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

    // Pagination
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const paginatedExpenses = filteredExpenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getCategoryInfo = (categoryValue) => {
        return categories.find(c => c.value === categoryValue) || categories[categories.length - 1];
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-gray-600 text-sm font-semibold mb-2 uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                    {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
                </div>
                <div className={`p-4 rounded-xl ${color}`}>
                    <Icon size={28} className="text-white" />
                </div>
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{trend >= 0 ? '+' : ''}{trend}% from last month</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Notification */}
            {notification.show && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg transition-all duration-300 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}>
                    {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium">{notification.message}</span>
                    <button onClick={() => setNotification({ show: false, type: '', message: '' })}>
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        {categoryFilter === 'salary' ? 'Salary Payments' :
                            categoryFilter === 'utilities' ? 'Utility Expenses' :
                                categoryFilter === 'medical_supplies' ? 'Medical Supplies' :
                                    'Expense Management'}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        {categoryFilter === 'salary' ? 'Manage doctor and staff salary payments' :
                            categoryFilter === 'utilities' ? 'Track utility bills and services' :
                                categoryFilter === 'medical_supplies' ? 'Track medical supplies and consumables' :
                                    'Track and manage all hospital expenses'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchExpenses}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                    >
                        <Plus size={20} />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Wallet}
                    title="Total Expenses"
                    value={`KES ${stats.totalExpenses.toLocaleString()}`}
                    subtitle="All time"
                    color="bg-blue-600"
                />
                <StatCard
                    icon={Calendar}
                    title="This Month"
                    value={`KES ${stats.monthlyExpenses.toLocaleString()}`}
                    subtitle={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    color="bg-green-600"
                    trend={5}
                />
                <StatCard
                    icon={Users}
                    title="Salaries"
                    value={`KES ${((stats.byCategory.doctor_salary || 0) + (stats.byCategory.staff_payment || 0)).toLocaleString()}`}
                    subtitle="Staff payments"
                    color="bg-purple-600"
                />
                <StatCard
                    icon={Zap}
                    title="Utilities"
                    value={`KES ${(stats.byCategory.utilities || 0).toLocaleString()}`}
                    subtitle="Bills & services"
                    color="bg-orange-600"
                />
            </div>

            {/* Quick Category Links */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Expense Categories</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                    {categories.map((cat) => {
                        const CategoryIcon = cat.icon;
                        const categoryTotal = stats.byCategory[cat.value] || 0;
                        return (
                            <button
                                key={cat.value}
                                onClick={() => setCategoryFilter(cat.value === categoryFilter ? 'all' : cat.value)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 border-2 ${categoryFilter === cat.value
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                <div className={`p-3 rounded-lg ${cat.color}`}>
                                    <CategoryIcon size={20} className="text-white" />
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center">{cat.label}</span>
                                <span className="text-xs font-bold text-gray-900">{categoryTotal.toLocaleString()}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                        {(categoryFilter !== 'all' || dateRange.start || dateRange.end || searchTerm) && (
                            <button
                                onClick={() => {
                                    setCategoryFilter('all');
                                    setDateRange({ start: '', end: '' });
                                    setSearchTerm('');
                                }}
                                className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th
                                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('expense_date')}
                                >
                                    <div className="flex items-center gap-2">
                                        Date
                                        {sortConfig.key === 'expense_date' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        )}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('title')}
                                >
                                    <div className="flex items-center gap-2">
                                        Title
                                        {sortConfig.key === 'title' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Paid To</th>
                                <th
                                    className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('amount')}
                                >
                                    <div className="flex items-center gap-2">
                                        Amount
                                        {sortConfig.key === 'amount' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx}>
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-10 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
                                        <p className="text-gray-500 text-lg">No expenses found</p>
                                        <p className="text-gray-400 text-sm">Add your first expense to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedExpenses.map((expense) => {
                                    const catInfo = getCategoryInfo(expense.category);
                                    const CategoryIcon = catInfo.icon;
                                    return (
                                        <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(expense.expense_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-900">{expense.title}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${catInfo.color}`}>
                                                        <CategoryIcon size={14} className="text-white" />
                                                    </div>
                                                    <span className="text-sm text-gray-600">{catInfo.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{expense.paid_to}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900">
                                                    KES {parseFloat(expense.amount).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(expense)}
                                                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} expenses
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                                const pageNum = idx + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-4 py-2 rounded-lg transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {showEditModal ? 'Edit Expense' : 'Add New Expense'}
                            </h2>
                            <button
                                onClick={closeModals}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                    placeholder="e.g., Monthly Salary - Dr. Smith"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                    required
                                >
                                    {categories.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (KES) *</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                                    <input
                                        type="date"
                                        value={formData.expense_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Paid To *</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        list={(formData.category === 'doctor_salary' || formData.category === 'staff_payment') ? "users-list" : ""}
                                        value={formData.paid_to}
                                        onChange={(e) => setFormData(prev => ({ ...prev, paid_to: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                        placeholder={(formData.category === 'doctor_salary' || formData.category === 'staff_payment') ? "Select staff or type name..." : "e.g., Kenya Power, XYZ Supplies"}
                                        required
                                    />
                                    {(formData.category === 'doctor_salary' || formData.category === 'staff_payment') && (
                                        <datalist id="users-list">
                                            {users.map(user => (
                                                <option key={user.id} value={`${user.username}`} />
                                            ))}
                                        </datalist>
                                    )}
                                </div>
                                {(formData.category === 'doctor_salary' || formData.category === 'staff_payment') && (
                                    <p className="text-xs text-gray-500 mt-1">Select a system user or type a name manually for external staff.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                                    rows={3}
                                    placeholder="Add any additional notes..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModals}
                                    className="flex-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitLoading ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <Check size={18} />
                                    )}
                                    {showEditModal ? 'Update Expense' : 'Add Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesManagement;
