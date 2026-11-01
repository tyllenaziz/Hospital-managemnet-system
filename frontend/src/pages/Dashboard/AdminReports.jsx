import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Users,
    Package,
    Activity,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Calendar,
    Printer,
    RefreshCw,
    PieChart,
    BarChart3,
    Stethoscope,
    Pill,
    Microscope,
    Clock,
    CheckCircle,
    XCircle,
    ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const AdminReports = () => {
    const { authenticatedFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30days');
    const [revenueStats, setRevenueStats] = useState([]);
    const [patientStats, setPatientStats] = useState({ growth: [], genderDistribution: [], ageDistribution: [] });
    const [departmentStats, setDepartmentStats] = useState({ queue: [], revenue: [] });
    const [inventoryStats, setInventoryStats] = useState({ lowStock: 0, expiringSoon: 0, expired: 0, total: 0 });
    const [dashboardStats, setDashboardStats] = useState({});

    useEffect(() => {
        fetchAllReports();
    }, [period]);

    const fetchAllReports = async () => {
        setLoading(true);
        try {
            const [revenueRes, patientRes, departmentRes, inventoryRes, dashboardRes] = await Promise.all([
                authenticatedFetch(`${API_BASE_URL}/admin/revenue/stats?period=${period}`),
                authenticatedFetch(`${API_BASE_URL}/admin/patients/stats?period=${period}`),
                authenticatedFetch(`${API_BASE_URL}/admin/department/stats`),
                authenticatedFetch(`${API_BASE_URL}/admin/inventory/stats`),
                authenticatedFetch(`${API_BASE_URL}/admin/dashboard/stats`)
            ]);

            const [revenueData, patientData, departmentData, inventoryData, dashboardData] = await Promise.all([
                revenueRes.json(),
                patientRes.json(),
                departmentRes.json(),
                inventoryRes.json(),
                dashboardRes.json()
            ]);

            if (revenueData.success) setRevenueStats(revenueData.revenueStats || []);
            if (patientData.success) setPatientStats(patientData.patientStats || {});
            if (departmentData.success) setDepartmentStats(departmentData.departmentStats || {});
            if (inventoryData.success) setInventoryStats(inventoryData.inventoryStats || {});
            if (dashboardData.success) setDashboardStats(dashboardData.stats || {});
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate totals from revenue stats
    const revenueTotals = revenueStats.reduce((acc, day) => ({
        total: acc.total + parseFloat(day.revenue || 0),
        consultation: acc.consultation + parseFloat(day.consultation_revenue || 0),
        lab: acc.lab + parseFloat(day.lab_revenue || 0),
        pharmacy: acc.pharmacy + parseFloat(day.pharmacy_revenue || 0),
        paid: acc.paid + parseFloat(day.paid_revenue || 0),
        pending: acc.pending + parseFloat(day.pending_revenue || 0),
        billsCount: acc.billsCount + parseInt(day.bills_count || 0),
        expenses: acc.expenses + parseFloat(day.expenses || 0),
        profit: acc.profit + parseFloat(day.profit || 0)
    }), { total: 0, consultation: 0, lab: 0, pharmacy: 0, paid: 0, pending: 0, billsCount: 0, expenses: 0, profit: 0 });

    const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all h-full">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
                    {trend !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{trend >= 0 ? '+' : ''}{trend}%</span>
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-xl ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
    );

    const SectionHeader = ({ icon: Icon, title, color }) => (
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <RefreshCw size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 print:p-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
                        <p className="text-gray-600">Comprehensive overview of all operations</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                        <option value="12months">Last 12 Months</option>
                    </select>
                    <button
                        onClick={fetchAllReports}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Printer size={18} />
                        Print Report
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-8">
                <h1 className="text-2xl font-bold">Bensmma Hospital - System Report</h1>
                <p className="text-gray-600">Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="text-gray-500">Period: {period.replace('days', ' Days').replace('months', ' Months')}</p>
            </div>

            {/* Revenue Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <SectionHeader icon={DollarSign} title="Financial Summary" color="bg-green-600" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <StatCard
                        icon={DollarSign}
                        title="Total Revenue"
                        value={`KES ${revenueTotals.total.toLocaleString()}`}
                        subtitle={`${revenueTotals.billsCount} bills generated`}
                        color="bg-blue-600"
                    />
                    <StatCard
                        icon={TrendingDown}
                        title="Total Expenses"
                        value={`KES ${revenueTotals.expenses.toLocaleString()}`}
                        subtitle="Operational costs"
                        color="bg-red-500"
                    />
                    <StatCard
                        icon={Activity}
                        title="Net Profit"
                        value={`KES ${revenueTotals.profit.toLocaleString()}`}
                        subtitle="Revenue - Expenses"
                        color={revenueTotals.profit >= 0 ? "bg-emerald-600" : "bg-orange-600"}
                    />
                    <StatCard
                        icon={CheckCircle}
                        title="Paid Amount"
                        value={`KES ${revenueTotals.paid.toLocaleString()}`}
                        subtitle={`${((revenueTotals.paid / revenueTotals.total) * 100 || 0).toFixed(1)}% collection rate`}
                        color="bg-green-600"
                    />
                    <StatCard
                        icon={Clock}
                        title="Pending Amount"
                        value={`KES ${revenueTotals.pending.toLocaleString()}`}
                        subtitle="Awaiting payment"
                        color="bg-amber-600"
                    />
                    <StatCard
                        icon={Activity}
                        title="Today's Revenue"
                        value={`KES ${(dashboardStats.todayRevenue || 0).toLocaleString()}`}
                        subtitle={`Total: KES ${(dashboardStats.totalRevenue || 0).toLocaleString()}`}
                        color="bg-purple-600"
                    />
                </div>

                {/* Revenue by Department */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                            <Stethoscope size={20} className="text-blue-600" />
                            <span className="font-medium text-blue-900">Consultation</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">KES {revenueTotals.consultation.toLocaleString()}</p>
                        <p className="text-blue-500 text-sm">{((revenueTotals.consultation / revenueTotals.total) * 100 || 0).toFixed(1)}% of total</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-3 mb-2">
                            <Microscope size={20} className="text-purple-600" />
                            <span className="font-medium text-purple-900">Laboratory</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">KES {revenueTotals.lab.toLocaleString()}</p>
                        <p className="text-purple-500 text-sm">{((revenueTotals.lab / revenueTotals.total) * 100 || 0).toFixed(1)}% of total</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                            <Pill size={20} className="text-green-600" />
                            <span className="font-medium text-green-900">Pharmacy</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">KES {revenueTotals.pharmacy.toLocaleString()}</p>
                        <p className="text-green-500 text-sm">{((revenueTotals.pharmacy / revenueTotals.total) * 100 || 0).toFixed(1)}% of total</p>
                    </div>
                </div>
            </div>

            {/* Patient Statistics */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <SectionHeader icon={Users} title="Patient Statistics" color="bg-blue-600" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        icon={Users}
                        title="Total Patients"
                        value={(dashboardStats.totalPatients || 0).toLocaleString()}
                        subtitle="Registered patients"
                        color="bg-blue-600"
                    />
                    <StatCard
                        icon={Calendar}
                        title="Today's Visits"
                        value={dashboardStats.todayAppointments || 0}
                        subtitle="Queue entries today"
                        color="bg-purple-600"
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="New This Period"
                        value={(patientStats.growth || []).reduce((sum, d) => sum + (d.patient_count || 0), 0)}
                        subtitle={`In ${period.replace('days', ' days').replace('months', ' months')}`}
                        color="bg-teal-600"
                    />
                    <StatCard
                        icon={Activity}
                        title="Active Staff"
                        value={dashboardStats.activeUsers || 0}
                        subtitle={`of ${dashboardStats.totalStaff || 0} total`}
                        color="bg-amber-600"
                    />
                </div>

                {/* Demographics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gender Distribution */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <PieChart size={18} className="text-gray-600" />
                            Gender Distribution
                        </h3>
                        <div className="space-y-3">
                            {(patientStats.genderDistribution || []).map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-gray-700">{item.gender}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${item.gender === 'Male' ? 'bg-blue-500' :
                                                    item.gender === 'Female' ? 'bg-pink-500' : 'bg-gray-500'
                                                    }`}
                                                style={{
                                                    width: `${(item.count / (patientStats.genderDistribution || []).reduce((s, i) => s + i.count, 0) * 100) || 0}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-gray-900 font-medium w-12 text-right">{item.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Age Distribution */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 size={18} className="text-gray-600" />
                            Age Distribution
                        </h3>
                        <div className="space-y-3">
                            {(patientStats.ageDistribution || []).map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-gray-700">{item.age_group}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                                                style={{
                                                    width: `${(item.count / (patientStats.ageDistribution || []).reduce((s, i) => s + i.count, 0) * 100) || 0}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-gray-900 font-medium w-12 text-right">{item.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <SectionHeader icon={Package} title="Inventory Summary" color="bg-amber-600" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={Package}
                        title="Total Medicines"
                        value={inventoryStats.total || 0}
                        subtitle="Items in inventory"
                        color="bg-blue-600"
                    />
                    <div className="bg-white rounded-2xl shadow-lg border border-amber-200 p-6 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-600 text-sm font-medium mb-1">Low Stock</p>
                                <p className="text-2xl font-bold text-amber-700">{inventoryStats.lowStock || 0}</p>
                                <p className="text-amber-500 text-xs mt-1">Less than 10 units</p>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-500">
                                <AlertTriangle size={24} className="text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-orange-200 p-6 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-600 text-sm font-medium mb-1">Expiring Soon</p>
                                <p className="text-2xl font-bold text-orange-700">{inventoryStats.expiringSoon || 0}</p>
                                <p className="text-orange-500 text-xs mt-1">Within 30 days</p>
                            </div>
                            <div className="p-4 rounded-xl bg-orange-500">
                                <Clock size={24} className="text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-600 text-sm font-medium mb-1">Expired</p>
                                <p className="text-2xl font-bold text-red-700">{inventoryStats.expired || 0}</p>
                                <p className="text-red-500 text-xs mt-1">Needs removal</p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500">
                                <XCircle size={24} className="text-white" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Health Bar */}
                <div className="mt-6 bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Inventory Health</h3>
                    <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                        <div
                            className="bg-green-500"
                            style={{ width: `${((inventoryStats.total - inventoryStats.lowStock - inventoryStats.expiringSoon - inventoryStats.expired) / inventoryStats.total * 100) || 0}%` }}
                            title="Healthy Stock"
                        ></div>
                        <div
                            className="bg-amber-500"
                            style={{ width: `${(inventoryStats.lowStock / inventoryStats.total * 100) || 0}%` }}
                            title="Low Stock"
                        ></div>
                        <div
                            className="bg-orange-500"
                            style={{ width: `${(inventoryStats.expiringSoon / inventoryStats.total * 100) || 0}%` }}
                            title="Expiring Soon"
                        ></div>
                        <div
                            className="bg-red-500"
                            style={{ width: `${(inventoryStats.expired / inventoryStats.total * 100) || 0}%` }}
                            title="Expired"
                        ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Healthy</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full"></span> Low Stock</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full"></span> Expiring</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Expired</span>
                    </div>
                </div>
            </div>

            {/* Department Statistics */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <SectionHeader icon={Activity} title="Department Statistics (Today)" color="bg-purple-600" />

                {/* Department Revenue */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Revenue by Department (Today)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(departmentStats.revenue || []).map((dept, index) => (
                            <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center gap-3 mb-2">
                                    {dept.department === 'Consultation' && <Stethoscope size={20} className="text-blue-600" />}
                                    {dept.department === 'Laboratory' && <Microscope size={20} className="text-purple-600" />}
                                    {dept.department === 'Pharmacy' && <Pill size={20} className="text-green-600" />}
                                    <span className="font-medium text-gray-900">{dept.department}</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-800">KES {parseFloat(dept.revenue || 0).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Queue Statistics */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-4">Queue Statistics (Today)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-3 rounded-l-lg font-semibold text-gray-700">Department</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-center">Waiting</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-center">In Progress</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-center">Done</th>
                                    <th className="px-4 py-3 rounded-r-lg font-semibold text-gray-700 text-center">Cancelled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['doctor', 'nurse', 'lab', 'pharmacy'].map((dept) => {
                                    const deptStats = (departmentStats.queue || []).filter(q => q.department === dept);
                                    const waiting = deptStats.find(q => q.status === 'waiting')?.count || 0;
                                    const inProgress = deptStats.find(q => q.status === 'in_progress')?.count || 0;
                                    const done = deptStats.find(q => q.status === 'done')?.count || 0;
                                    const cancelled = deptStats.find(q => q.status === 'cancelled')?.count || 0;

                                    return (
                                        <tr key={dept} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900 capitalize">{dept}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">{waiting}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{inProgress}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">{done}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">{cancelled}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block text-center mt-8 pt-4 border-t">
                <p className="text-gray-500 text-sm">This report was generated by Bensmma Hospital Management System</p>
            </div>
        </div>
    );
};

export default AdminReports;
