import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, FlaskConical, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LabTestResultModal = ({ isOpen, test, orderId, onClose, onSave }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [parameterResults, setParameterResults] = useState({
        general_remarks: '',
        parameters: []
    });

    useEffect(() => {
        if (test && isOpen) {
            setParameterResults({
                general_remarks: test.parameters[0]?.result?.remarks || '',
                parameters: test.parameters.map((param) => ({
                    parameter_id: param.param_id,
                    result_value: param.result?.result_value || '',
                    remarks: param.result?.remarks || '',
                    is_abnormal: param.result?.is_abnormal || false,
                    result_id: param.result?.result_id || null
                }))
            });
            setError(null);
        }
    }, [test, isOpen]);

    const handleParameterChange = (paramIndex, field, value) => {
        setParameterResults((prev) => ({
            ...prev,
            parameters: prev.parameters.map((param, idx) =>
                idx === paramIndex ? { ...param, [field]: value } : param
            )
        }));
    };

    const handleSave = async () => {
        const hasEmptyValues = parameterResults.parameters.some((parameter) => !parameter.result_value);
        if (hasEmptyValues) {
            setError('Please fill in all parameter values');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const isUpdate = test.item_status === 'completed';
            const response = await authenticatedFetch(
                `${API_BASE_URL}/lab/results/${test.item_id}`,
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
                if (data.allCompleted && data.newQueue) {
                    toast.success('All lab tests completed. Patient has been sent back to the doctor.');
                    onClose();
                    navigate('/lab/dashboard');
                } else {
                    onSave(data);
                    onClose();
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

    if (!isOpen || !test) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-blue-600 p-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                            <FlaskConical size={24} />
                            {test.test_name}
                        </h2>
                        <p className="text-sm text-teal-100">
                            {test.category} - Code: {test.test_code}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-lg p-2 text-white transition hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                            <AlertCircle size={18} />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-100">
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Parameter</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Normal Range</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Result *</th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Abnormal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {test.parameters.map((param, idx) => (
                                    <tr key={param.param_id} className="border-b border-gray-100 hover:bg-white">
                                        <td className="px-4 py-3 font-medium text-gray-800">{param.parameter_name}</td>
                                        <td className="px-4 py-3 text-gray-600">{param.unit || '-'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{param.normal_range || '-'}</td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={parameterResults.parameters[idx]?.result_value || ''}
                                                onChange={(e) => handleParameterChange(idx, 'result_value', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-teal-500"
                                                placeholder="Enter value"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={parameterResults.parameters[idx]?.is_abnormal || false}
                                                onChange={(e) => handleParameterChange(idx, 'is_abnormal', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <label className="mb-2 block font-medium text-gray-700">General Remarks</label>
                        <textarea
                            value={parameterResults.general_remarks}
                            onChange={(e) => setParameterResults((prev) => ({ ...prev, general_remarks: e.target.value }))}
                            placeholder="Enter general observations or notes for this test..."
                            rows={3}
                            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>

                <div className="flex gap-3 border-t bg-gray-50 p-4">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 rounded-lg bg-gray-200 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-300 disabled:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 font-medium text-white transition hover:bg-teal-700 disabled:bg-gray-400"
                    >
                        {saving ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>{test.item_status === 'completed' ? 'Update Results' : 'Save Results'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabTestResultModal;
