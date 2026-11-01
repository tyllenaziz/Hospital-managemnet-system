import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FlaskConical, AlertCircle, CheckCircle, User, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const LabTestResultsEntry = () => {
    const { orderId, testItemId } = useParams();
    const navigate = useNavigate();
    const { authenticatedFetch } = useAuth();

    const [order, setOrder] = useState(null);
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [parameterResults, setParameterResults] = useState({
        general_remarks: '',
        parameters: []
    });

    useEffect(() => {
        fetchTestDetails();
    }, [orderId, testItemId]);

    const fetchTestDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch the order details to get test information
            const response = await authenticatedFetch(`${API_BASE_URL}/lab/orders/${orderId}`);
            const orderData = await response.json();
            setOrder(orderData);

            // Find the specific test from the order
            const testData = orderData.tests?.find(t => t.item_id === parseInt(testItemId));
            if (!testData) {
                setError('Test not found in order');
                return;
            }

            setTest(testData);

            // Initialize parameter results
            setParameterResults({
                general_remarks: testData.parameters?.[0]?.result?.remarks || '',
                parameters: testData.parameters?.map(param => ({
                    parameter_id: param.param_id,
                    result_value: param.result?.result_value || '',
                    remarks: param.result?.remarks || '',
                    is_abnormal: param.result?.is_abnormal || false,
                    result_id: param.result?.result_id || null
                })) || []
            });
        } catch (err) {
            console.error('Error fetching test details:', err);
            setError(err.message || 'Failed to load test details');
        } finally {
            setLoading(false);
        }
    };

    const handleParameterChange = (paramIndex, field, value) => {
        setParameterResults(prev => ({
            ...prev,
            parameters: prev.parameters.map((param, idx) =>
                idx === paramIndex ? { ...param, [field]: value } : param
            )
        }));
    };

    const handleSave = async () => {
        // Validate all parameters have values
        const hasEmptyValues = parameterResults.parameters.some(p => !p.result_value);
        if (hasEmptyValues) {
            setError('Please fill in all parameter values');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const isUpdate = test.item_status === 'completed';
            const response = await authenticatedFetch(
                `${API_BASE_URL}/lab/results/${testItemId}`,
                {
                    method: isUpdate ? 'PUT' : 'POST',
                    body: JSON.stringify({
                        results: parameterResults.parameters,
                        general_remarks: parameterResults.general_remarks
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                // Check if all tests are completed and patient was auto-sent to doctor
                if (data.allCompleted && data.newQueue) {
                    toast.success('All lab tests completed. Patient has been sent back to the doctor.');
                    navigate('/lab/dashboard');
                } else {
                    setSuccessMessage('Results saved successfully!');
                    // Navigate back to order details after a brief delay
                    setTimeout(() => {
                        navigate(`/lab/orders/${orderId}`);
                    }, 1500);
                }
            } else {
                setError(data.error || 'Failed to save results');
            }
        } catch (err) {
            console.error('Error saving results:', err);
            setError(err.message || 'Failed to save results');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="text-slate-600 mt-4">Loading test details...</p>
                </div>
            </div>
        );
    }

    if (error && !test) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <FlaskConical className="mx-auto text-slate-300 mb-4" size={64} />
                    <h3 className="text-slate-800 font-semibold mb-2">Test not found</h3>
                    <p className="text-slate-600 mb-4">{error || 'Unable to load test'}</p>
                    <button
                        onClick={() => navigate(`/lab/orders/${orderId}`)}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-medium"
                    >
                        Back to Order
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
            <div className="max-w-6xl mx-auto space-y-4">
                {/* Back Button */}
                <button
                    onClick={() => navigate(`/lab/orders/${orderId}`)}
                    className="flex items-center gap-2 text-slate-600 hover:text-teal-700 transition font-medium text-sm"
                >
                    <ArrowLeft size={18} />
                    Back to Lab Order #{orderId}
                </button>

                {/* Page Header */}
                <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <FlaskConical className="text-white" size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">{test?.test_name}</h1>
                                <p className="text-teal-100">
                                    {test?.category} • Code: {test?.test_code}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${test?.item_status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {test?.item_status === 'completed' ? 'COMPLETED' : 'PENDING'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <User className="text-blue-600" size={18} />
                                </div>
                                <div>
                                    <p className="text-slate-600 text-xs">Patient</p>
                                    <p className="text-slate-800 font-semibold">{order?.patient_name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <Calendar className="text-purple-600" size={18} />
                                </div>
                                <div>
                                    <p className="text-slate-600 text-xs">Order Date</p>
                                    <p className="text-slate-800 font-semibold">
                                        {new Date(order?.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <FileText className="text-green-600" size={18} />
                                </div>
                                <div>
                                    <p className="text-slate-600 text-xs">Ordered By</p>
                                    <p className="text-slate-800 font-semibold">Dr. {order?.doctor_name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                        <AlertCircle size={20} />
                        <p>{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
                        <CheckCircle size={20} />
                        <p>{successMessage}</p>
                    </div>
                )}

                {/* Results Entry Table */}
                <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FlaskConical className="text-teal-600" size={20} />
                            Enter Test Results
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Fill in the result values for each parameter. Mark as abnormal if outside normal range.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-4 px-6 text-gray-700 font-semibold">#</th>
                                    <th className="text-left py-4 px-6 text-gray-700 font-semibold">Parameter</th>
                                    <th className="text-left py-4 px-6 text-gray-700 font-semibold">Unit</th>
                                    <th className="text-left py-4 px-6 text-gray-700 font-semibold">Normal Range</th>
                                    <th className="text-left py-4 px-6 text-gray-700 font-semibold min-w-[200px]">Result Value *</th>
                                    <th className="text-center py-4 px-6 text-gray-700 font-semibold">Abnormal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {test?.parameters?.map((param, idx) => (
                                    <tr key={param.param_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="py-4 px-6 text-gray-500 font-medium">{idx + 1}</td>
                                        <td className="py-4 px-6">
                                            <p className="font-semibold text-gray-800">{param.parameter_name}</p>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600">{param.unit || '-'}</td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {param.normal_range || '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <input
                                                type="text"
                                                value={parameterResults.parameters[idx]?.result_value || ''}
                                                onChange={(e) => handleParameterChange(idx, 'result_value', e.target.value)}
                                                className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition ${parameterResults.parameters[idx]?.is_abnormal
                                                        ? 'border-red-300 bg-red-50'
                                                        : 'border-gray-200'
                                                    }`}
                                                placeholder="Enter result value"
                                            />
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <label className="inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={parameterResults.parameters[idx]?.is_abnormal || false}
                                                    onChange={(e) => handleParameterChange(idx, 'is_abnormal', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* General Remarks */}
                <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6">
                    <label className="block text-gray-800 font-semibold mb-3">
                        <FileText className="inline-block mr-2 text-teal-600" size={18} />
                        General Remarks / Observations
                    </label>
                    <textarea
                        value={parameterResults.general_remarks}
                        onChange={(e) => setParameterResults(prev => ({ ...prev, general_remarks: e.target.value }))}
                        placeholder="Enter any general observations, notes, or clinical comments for this test..."
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition"
                    />
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate(`/lab/orders/${orderId}`)}
                            disabled={saving}
                            className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold rounded-lg transition flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={18} />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-3 px-6 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Saving Results...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{test?.item_status === 'completed' ? 'Update Results' : 'Save Results'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabTestResultsEntry;
