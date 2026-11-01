import React, { useState, useEffect } from 'react';
import {
    FileText, Filter, Search, RefreshCw, Eye, Send, Plus,
    ArrowLeft, ChevronLeft, ChevronRight, DollarSign, Calendar
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const ClaimsList = () => {
    const { authenticatedFetch } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [claims, setClaims] = useState([]);
    const [providers, setProviders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({
        status: '',
        providerId: '',
        startDate: '',
        endDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchClaims();
        fetchProviders();
    }, [pagination.page, filters]);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

            const response = await authenticatedFetch(`${API_BASE_URL}/insurance/claims?${params}`);
            const data = await response.json();

            if (data.success) {
                setClaims(data.claims);
                setPagination(prev => ({ ...prev, ...data.pagination }));
            }
        } catch (error) {
            console.error('Error fetching claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProviders = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/insurance/providers`);
            const data = await response.json();
            if (data.success) {
                setProviders(data.providers);
            }
        } catch (error) {
            console.error('Error fetching providers:', error);
        }
    };

    const handleSubmitClaim = async (claimId) => {
        if (!confirm('Submit this claim to the insurer?')) return;

        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/insurance/claims/${claimId}/submit`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                alert(`Claim submitted successfully!\nExternal ID: ${data.externalClaimId || 'N/A'}`);
                fetchClaims();
            } else {
                alert(data.error || 'Failed to submit claim');
            }
        } catch (error) {
            console.error('Error submitting claim:', error);
            alert('Failed to submit claim');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            draft: 'bg-gray-100 text-gray-700',
            pending: 'bg-yellow-100 text-yellow-700',
            submitted: 'bg-blue-100 text-blue-700',
            processing: 'bg-indigo-100 text-indigo-700',
            approved: 'bg-green-100 text-green-700',
            partially_approved: 'bg-lime-100 text-lime-700',
            rejected: 'bg-red-100 text-red-700',
            paid: 'bg-emerald-100 text-emerald-700',
            cancelled: 'bg-gray-100 text-gray-500'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const statuses = ['draft', 'pending', 'submitted', 'processing', 'approved', 'partially_approved', 'rejected', 'paid'];

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to="/admin/insurance" className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FileText className="text-blue-600" />
                            Insurance Claims
                        </h1>
                        <p className="text-gray-600">Manage and track insurance claims</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                        <Filter size={18} />
                        Filters
                    </button>
                    <Link
                        to="/admin/insurance/claims/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        <Plus size={18} />
                        New Claim
                    </Link>
                    <button
                        onClick={fetchClaims}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl p-4 shadow border">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map(s => (
                                    <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Provider</label>
                            <select
                                value={filters.providerId}
                                onChange={(e) => setFilters({ ...filters, providerId: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            >
                                <option value="">All Providers</option>
                                {providers.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ status: '', providerId: '', startDate: '', endDate: '' })}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Claims Table */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Claim #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Patient</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Provider</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Service Date</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Amount</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center">
                                        <RefreshCw className="animate-spin mx-auto mb-2 text-gray-400" />
                                        Loading...
                                    </td>
                                </tr>
                            ) : claims.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        No claims found
                                    </td>
                                </tr>
                            ) : (
                                claims.map(claim => (
                                    <tr key={claim.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-blue-600">{claim.claim_number}</div>
                                            <div className="text-xs text-gray-500">{claim.member_number}</div>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{claim.patient_name}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{claim.provider_code}</div>
                                            <div className="text-xs text-gray-500">{claim.provider_name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm capitalize">{claim.claim_type}</td>
                                        <td className="px-4 py-3 text-sm">{claim.service_date}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="font-medium">KES {parseFloat(claim.claimed_amount).toLocaleString()}</div>
                                            {claim.approved_amount > 0 && (
                                                <div className="text-xs text-green-600">
                                                    Approved: KES {parseFloat(claim.approved_amount).toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(claim.status)}`}>
                                                {claim.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/admin/insurance/claims/${claim.id}`)}
                                                    className="p-1.5 hover:bg-gray-100 rounded"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} className="text-gray-500" />
                                                </button>
                                                {(claim.status === 'draft' || claim.status === 'pending') && (
                                                    <button
                                                        onClick={() => handleSubmitClaim(claim.id)}
                                                        className="p-1.5 hover:bg-blue-100 rounded"
                                                        title="Submit to Insurer"
                                                    >
                                                        <Send size={16} className="text-blue-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            disabled={pagination.page <= 1}
                            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-3 py-2 text-sm">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClaimsList;
