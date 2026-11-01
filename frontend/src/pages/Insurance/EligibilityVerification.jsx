import React, { useState } from 'react';
import {
    Search, CheckCircle, XCircle, AlertTriangle, User, Shield,
    Calendar, DollarSign, RefreshCw, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const EligibilityVerification = () => {
    const { authenticatedFetch } = useAuth();
    const [loading, setLoading] = useState(false);
    const [searchData, setSearchData] = useState({
        national_id: '',
        member_number: ''
    });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleVerify = async () => {
        if (!searchData.national_id) {
            setError('Please enter a National ID');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setResult(null);

            const response = await authenticatedFetch(`${API_BASE_URL}/insurance/verify`, {
                method: 'POST',
                body: JSON.stringify(searchData)
            });
            const data = await response.json();

            if (data.success) {
                setResult(data);
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Failed to verify eligibility');
        } finally {
            setLoading(false);
        }
    };

    const renderResult = () => {
        if (!result) return null;

        const { verified, data, source } = result;

        if (!verified) {
            return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mt-6">
                    <div className="flex items-center gap-3 mb-4">
                        <XCircle className="text-red-600" size={32} />
                        <div>
                            <h3 className="text-xl font-bold text-red-800">Not Eligible</h3>
                            <p className="text-red-600">{data?.reason || 'Member not found or inactive'}</p>
                        </div>
                    </div>
                    <div className="bg-white/50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-red-800">
                            <strong>Error Code:</strong> {data?.error_code || 'UNKNOWN'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Source: {source}
                        </p>
                    </div>
                </div>
            );
        }

        const member = data.member || {};
        const coverage = data.coverage || {};

        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-6">
                <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="text-green-600" size={32} />
                    <div>
                        <h3 className="text-xl font-bold text-green-800">Eligible for Coverage</h3>
                        <p className="text-green-600">Member verified successfully</p>
                    </div>
                    <span className="ml-auto px-3 py-1 bg-green-200 text-green-800 text-sm rounded-full">
                        {source}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Member Information */}
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <User size={18} className="text-blue-600" />
                            Member Information
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Full Name</span>
                                <span className="font-medium">{member.full_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">National ID</span>
                                <span className="font-medium">{member.national_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">SHA ID</span>
                                <span className="font-medium text-blue-600">{member.sha_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Member Number</span>
                                <span className="font-medium">{member.member_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Relationship</span>
                                <span className="font-medium capitalize">{member.relationship}</span>
                            </div>
                        </div>
                    </div>

                    {/* Coverage Information */}
                    <div className="bg-white rounded-xl p-5 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Shield size={18} className="text-green-600" />
                            Coverage Details
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Scheme</span>
                                <span className="font-medium">{coverage.scheme}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-medium ${coverage.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                    {coverage.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Effective Date</span>
                                <span className="font-medium">{coverage.effective_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Expiry Date</span>
                                <span className="font-medium">{coverage.expiry_date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Co-pay</span>
                                <span className="font-medium">{coverage.copay_percentage}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-blue-600" />
                            <span className="font-semibold text-blue-800">Outpatient Cover</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                            KES {(coverage.outpatient_balance || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600">
                            of KES {(coverage.outpatient_limit || 0).toLocaleString()} remaining
                        </p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={18} className="text-purple-600" />
                            <span className="font-semibold text-purple-800">Inpatient Cover</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                            KES {(coverage.inpatient_balance || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-purple-600">
                            of KES {(coverage.inpatient_limit || 0).toLocaleString()} remaining
                        </p>
                    </div>
                </div>

                {data.facility_contracted && (
                    <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
                        <CheckCircle className="inline mr-2 text-green-600" size={18} />
                        <span className="text-green-800 font-medium">Facility is contracted with SHA</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/admin/insurance" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft size={24} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Search className="text-green-600" />
                        Verify Eligibility
                    </h1>
                    <p className="text-gray-600">Check SHA/NHIF member eligibility and coverage</p>
                </div>
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-xl shadow border p-6">
                <h3 className="font-bold text-lg mb-4">Member Lookup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            National ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={searchData.national_id}
                            onChange={(e) => setSearchData({ ...searchData, national_id: e.target.value })}
                            placeholder="Enter National ID..."
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Member Number (Optional)
                        </label>
                        <input
                            type="text"
                            value={searchData.member_number}
                            onChange={(e) => setSearchData({ ...searchData, member_number: e.target.value })}
                            placeholder="SHA/NHIF member number..."
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <button
                    onClick={handleVerify}
                    disabled={loading}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="animate-spin" size={20} />
                            Verifying...
                        </>
                    ) : (
                        <>
                            <Search size={20} />
                            Verify Eligibility
                        </>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="text-red-600" size={24} />
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Result */}
            {renderResult()}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">ℹ️ About Eligibility Verification</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Real-time verification with SHA (Social Health Authority)</li>
                    <li>• Shows member coverage details and remaining balances</li>
                    <li>• Confirms if this facility is contracted</li>
                    <li>• Save verification to patient record for future reference</li>
                </ul>
            </div>
        </div>
    );
};

export default EligibilityVerification;
