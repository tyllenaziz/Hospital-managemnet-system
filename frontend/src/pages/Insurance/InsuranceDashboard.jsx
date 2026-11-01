import React, { useState, useEffect } from 'react';
import {
    Shield, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle,
    FileText, Users, TrendingUp, RefreshCw, ArrowLeft, Plus, Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const InsuranceDashboard = () => {
    const { authenticatedFetch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await authenticatedFetch(`${API_BASE_URL}/insurance/dashboard`);
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'submitted': return 'bg-blue-100 text-blue-700';
            case 'processing': return 'bg-indigo-100 text-indigo-700';
            case 'approved': return 'bg-green-100 text-green-700';
            case 'partially_approved': return 'bg-lime-100 text-lime-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'paid': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, color, href }) => {
        const content = (
            <div className="bg-white rounded-xl p-5 shadow border hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${color}`}>
                        <Icon size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
                    </div>
                </div>
            </div>
        );

        return href ? <Link to={href}>{content}</Link> : content;
    };

    // Calculate summary from claimsSummary
    const getSummaryTotals = () => {
        if (!stats?.claimsSummary) return { claims: 0, claimed: 0, approved: 0, paid: 0 };
        return stats.claimsSummary.reduce((acc, s) => ({
            claims: acc.claims + (s.count || 0),
            claimed: acc.claimed + parseFloat(s.total_claimed || 0),
            approved: acc.approved + parseFloat(s.total_approved || 0),
            paid: acc.paid + parseFloat(s.total_paid || 0)
        }), { claims: 0, claimed: 0, approved: 0, paid: 0 });
    };

    const totals = getSummaryTotals();

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
                    <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Shield className="text-blue-600" />
                            Insurance Management
                        </h1>
                        <p className="text-gray-600">NHIF/SHA Claims & Pre-Authorization Dashboard</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/admin/insurance/claims/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        <Plus size={18} />
                        New Claim
                    </Link>
                    <button
                        onClick={fetchDashboardStats}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={FileText}
                    title="Total Claims (30 days)"
                    value={totals.claims}
                    subtitle="Claims created"
                    color="bg-blue-600"
                    href="/admin/insurance/claims"
                />
                <StatCard
                    icon={DollarSign}
                    title="Total Claimed"
                    value={`KES ${totals.claimed.toLocaleString()}`}
                    subtitle="Amount submitted"
                    color="bg-purple-600"
                />
                <StatCard
                    icon={CheckCircle}
                    title="Total Approved"
                    value={`KES ${totals.approved.toLocaleString()}`}
                    subtitle="Amount approved"
                    color="bg-green-600"
                />
                <StatCard
                    icon={TrendingUp}
                    title="Total Paid"
                    value={`KES ${totals.paid.toLocaleString()}`}
                    subtitle="Amount received"
                    color="bg-emerald-600"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to="/admin/insurance/claims" className="bg-white rounded-xl p-4 shadow border hover:shadow-md transition flex items-center gap-3">
                    <FileText className="text-blue-600" size={24} />
                    <div>
                        <p className="font-semibold">View Claims</p>
                        <p className="text-sm text-gray-500">Manage all claims</p>
                    </div>
                </Link>
                <Link to="/admin/insurance/preauth" className="bg-white rounded-xl p-4 shadow border hover:shadow-md transition flex items-center gap-3">
                    <Clock className="text-amber-600" size={24} />
                    <div>
                        <p className="font-semibold">Pre-Authorizations</p>
                        <p className="text-sm text-gray-500">{stats?.pendingPreauths || 0} pending</p>
                    </div>
                </Link>
                <Link to="/admin/insurance/verify" className="bg-white rounded-xl p-4 shadow border hover:shadow-md transition flex items-center gap-3">
                    <Search className="text-green-600" size={24} />
                    <div>
                        <p className="font-semibold">Verify Eligibility</p>
                        <p className="text-sm text-gray-500">Check member status</p>
                    </div>
                </Link>
                <Link to="/admin/insurance/providers" className="bg-white rounded-xl p-4 shadow border hover:shadow-md transition flex items-center gap-3">
                    <Users className="text-purple-600" size={24} />
                    <div>
                        <p className="font-semibold">Insurance Providers</p>
                        <p className="text-sm text-gray-500">Manage providers</p>
                    </div>
                </Link>
            </div>

            {/* Claims by Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow border p-6">
                    <h3 className="font-bold text-lg mb-4">Claims by Status</h3>
                    {stats?.claimsSummary && stats.claimsSummary.length > 0 ? (
                        <div className="space-y-3">
                            {stats.claimsSummary.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-gray-600">{item.count} claims</span>
                                    </div>
                                    <span className="font-semibold">KES {parseFloat(item.total_claimed || 0).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No claims data available</p>
                    )}
                </div>

                {/* Claims by Provider */}
                <div className="bg-white rounded-xl shadow border p-6">
                    <h3 className="font-bold text-lg mb-4">Claims by Provider</h3>
                    {stats?.byProvider && stats.byProvider.length > 0 ? (
                        <div className="space-y-3">
                            {stats.byProvider.map((provider, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{provider.name}</p>
                                        <p className="text-sm text-gray-500">{provider.claim_count} claims</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">KES {parseFloat(provider.total_claimed || 0).toLocaleString()}</p>
                                        <p className="text-sm text-green-600">
                                            Approved: KES {parseFloat(provider.total_approved || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No provider data available</p>
                    )}
                </div>
            </div>

            {/* Claims Aging */}
            {stats?.aging && stats.aging.length > 0 && (
                <div className="bg-white rounded-xl shadow border p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" size={20} />
                        Outstanding Claims Aging
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {stats.aging.map((bucket, idx) => (
                            <div key={idx} className={`p-4 rounded-lg ${bucket.age_bucket === '60+ days' ? 'bg-red-50 border-red-200' :
                                    bucket.age_bucket === '31-60 days' ? 'bg-amber-50 border-amber-200' :
                                        'bg-gray-50 border-gray-200'
                                } border`}>
                                <p className="text-sm text-gray-600">{bucket.age_bucket}</p>
                                <p className="text-xl font-bold">{bucket.count} claims</p>
                                <p className="text-sm font-medium">KES {parseFloat(bucket.total || 0).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SHA Integration Status */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-2">SHA/NHIF Integration</h3>
                        <p className="text-blue-100">
                            Connected to Social Health Authority (SHA) API for real-time eligibility verification and claims submission.
                        </p>
                    </div>
                    <div className="bg-white/20 px-4 py-2 rounded-lg">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                            Mock Mode Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InsuranceDashboard;
