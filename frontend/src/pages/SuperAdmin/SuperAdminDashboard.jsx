import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolveAssetUrl } from '../../utils/assetUrl';
import {
    Building2, Users, GitBranch, Package,
    TrendingUp, AlertCircle, Plus, Settings,
    Activity, CheckCircle, Clock, XCircle
} from 'lucide-react';

const SuperAdminDashboard = () => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [stats, setStats] = useState({
        total_hospitals: 0,
        active_subscriptions: 0,
        trial_hospitals: 0,
        total_branches: 0,
        total_users: 0,
        total_admins: 0
    });
    const [recentHospitals, setRecentHospitals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch stats
            const statsRes = await authenticatedFetch(`${API_BASE_URL}/superadmin/dashboard/stats`);
            const statsData = await statsRes.json();
            if (statsData.success) {
                setStats(statsData.stats);
            }

            // Fetch recent hospitals
            const hospitalsRes = await authenticatedFetch(`${API_BASE_URL}/superadmin/hospitals`);
            const hospitalsData = await hospitalsRes.json();
            if (hospitalsData.success) {
                setRecentHospitals(hospitalsData.hospitals.slice(0, 5));
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color, link }) => (
        <Link to={link} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
                </div>
                <div className={`p-4 rounded-xl ${color}`}>
                    <Icon size={28} className="text-white" />
                </div>
            </div>
        </Link>
    );

    const getSubscriptionBadge = (status) => {
        const badges = {
            active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
            trial: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
            suspended: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
            expired: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
        };
        const badge = badges[status] || badges.trial;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                <Icon size={12} />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Vijomedix Platform
                    </h1>
                    <p className="text-gray-500 mt-1">Super Admin Dashboard</p>
                </div>
                <Link
                    to="/superadmin/hospitals/new"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
                >
                    <Plus size={20} />
                    Add Hospital
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                    icon={Building2}
                    title="Total Hospitals"
                    value={stats.total_hospitals}
                    subtitle="On the platform"
                    color="bg-gradient-to-br from-purple-500 to-indigo-600"
                    link="/superadmin/hospitals"
                />
                <StatCard
                    icon={CheckCircle}
                    title="Active Subscriptions"
                    value={stats.active_subscriptions}
                    subtitle="Paid hospitals"
                    color="bg-gradient-to-br from-green-500 to-emerald-600"
                    link="/superadmin/hospitals"
                />
                <StatCard
                    icon={Clock}
                    title="Trial Hospitals"
                    value={stats.trial_hospitals}
                    subtitle="In trial period"
                    color="bg-gradient-to-br from-blue-500 to-cyan-600"
                    link="/superadmin/hospitals"
                />
                <StatCard
                    icon={GitBranch}
                    title="Total Branches"
                    value={stats.total_branches}
                    subtitle="All locations"
                    color="bg-gradient-to-br from-amber-500 to-orange-600"
                    link="/superadmin/hospitals"
                />
                <StatCard
                    icon={Users}
                    title="Total Users"
                    value={stats.total_users}
                    subtitle="Across all hospitals"
                    color="bg-gradient-to-br from-pink-500 to-rose-600"
                    link="/superadmin/hospitals"
                />
                <StatCard
                    icon={Settings}
                    title="Hospital Admins"
                    value={stats.total_admins}
                    subtitle="Admin accounts"
                    color="bg-gradient-to-br from-slate-500 to-gray-600"
                    link="/superadmin/hospitals"
                />
            </div>

            {/* Recent Hospitals */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Recent Hospitals</h2>
                    <Link to="/superadmin/hospitals" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                        View All →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Hospital</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Code</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Status</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Branches</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Users</th>
                                <th className="text-left py-3 px-4 text-gray-500 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentHospitals.map(hospital => (
                                <tr key={hospital.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            {hospital.logo_path ? (
                                                <img
                                                    src={resolveAssetUrl(hospital.logo_path)}
                                                    alt={hospital.name}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                    <Building2 size={20} className="text-purple-600" />
                                                </div>
                                            )}
                                            <span className="font-medium text-gray-800">{hospital.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600 font-mono text-sm">{hospital.code}</td>
                                    <td className="py-4 px-4">{getSubscriptionBadge(hospital.subscription_status)}</td>
                                    <td className="py-4 px-4 text-gray-600">{hospital.branch_count || 0}</td>
                                    <td className="py-4 px-4 text-gray-600">{hospital.user_count || 0}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/superadmin/hospitals/${hospital.id}`}
                                                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                                            >
                                                Manage
                                            </Link>
                                            <Link
                                                to={`/superadmin/hospitals/${hospital.id}/modules`}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                            >
                                                Modules
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {recentHospitals.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">
                                        No hospitals yet. Click "Add Hospital" to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
