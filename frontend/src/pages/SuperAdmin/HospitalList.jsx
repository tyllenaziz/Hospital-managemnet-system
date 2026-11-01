import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolveAssetUrl } from '../../utils/assetUrl';
import {
    Building2, Plus, Search, Filter,
    MoreVertical, Edit, Trash2, Users,
    GitBranch, Package, CheckCircle, Clock,
    AlertCircle, XCircle, MapPin, Phone
} from 'lucide-react';

const HospitalList = () => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const navigate = useNavigate();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/superadmin/hospitals`);
            const data = await res.json();
            if (data.success) {
                setHospitals(data.hospitals);
            }
        } catch (error) {
            console.error('Fetch hospitals error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredHospitals = hospitals.filter(hospital => {
        const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hospital.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || hospital.subscription_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                    <h1 className="text-3xl font-bold text-gray-800">Hospitals</h1>
                    <p className="text-gray-500 mt-1">Manage all hospitals on the platform</p>
                </div>
                <Link
                    to="/superadmin/hospitals/new"
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
                >
                    <Plus size={20} />
                    Add Hospital
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search hospitals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="trial">Trial</option>
                            <option value="suspended">Suspended</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Hospital Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHospitals.map(hospital => (
                    <div
                        key={hospital.id}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
                    >
                        {/* Card Header with Logo */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    {hospital.logo_path ? (
                                        <img
                                            src={resolveAssetUrl(hospital.logo_path)}
                                            alt={hospital.name}
                                            className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                            <Building2 size={28} className="text-white" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{hospital.name}</h3>
                                        <p className="text-gray-500 text-sm font-mono">{hospital.code}</p>
                                    </div>
                                </div>
                                {getSubscriptionBadge(hospital.subscription_status)}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                                        <GitBranch size={14} />
                                    </div>
                                    <p className="text-xl font-bold text-gray-800">{hospital.branch_count || 0}</p>
                                    <p className="text-xs text-gray-500">Branches</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                                        <Users size={14} />
                                    </div>
                                    <p className="text-xl font-bold text-gray-800">{hospital.user_count || 0}</p>
                                    <p className="text-xs text-gray-500">Users</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                                        <Users size={14} />
                                    </div>
                                    <p className="text-xl font-bold text-gray-800">{hospital.admin_count || 0}</p>
                                    <p className="text-xs text-gray-500">Admins</p>
                                </div>
                            </div>

                            {hospital.city && (
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                    <MapPin size={14} />
                                    <span>{hospital.city}{hospital.county ? `, ${hospital.county}` : ''}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate(`/superadmin/hospitals/${hospital.id}`)}
                                    className="flex-1 bg-purple-50 text-purple-600 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors text-sm"
                                >
                                    Manage
                                </button>
                                <button
                                    onClick={() => navigate(`/superadmin/hospitals/${hospital.id}/modules`)}
                                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm"
                                >
                                    Modules
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredHospitals.length === 0 && (
                    <div className="col-span-full bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-800 mb-2">No hospitals found</h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm || statusFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first hospital'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <Link
                                to="/superadmin/hospitals/new"
                                className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
                            >
                                <Plus size={20} />
                                Add Hospital
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalList;
