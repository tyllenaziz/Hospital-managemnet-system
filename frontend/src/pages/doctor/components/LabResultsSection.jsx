import { FlaskConical, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LabResultsSection = ({ labResults, patientId }) => {
    const navigate = useNavigate();

    if (!labResults) return null;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FlaskConical className="text-blue-600" size={20} />
                    Lab Results Available
                </h3>
                <button
                    onClick={() => navigate(`/doctor/patient/${patientId}/lab-history`)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                >
                    <Eye size={14} />
                    View Full History
                </button>
            </div>

            <div className="space-y-2">
                <p className="text-sm text-gray-700">
                    <strong>Order #{labResults.id}</strong> - {new Date(labResults.order_date).toLocaleDateString()}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {labResults.tests?.slice(0, 6).map((test, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                            <p className="font-medium text-gray-800 text-sm">{test.test_name}</p>
                            {test.result && (
                                <div className="mt-1 text-xs">
                                    <span className="text-gray-600">Result: </span>
                                    <span className={`font-semibold ${test.result.is_abnormal ? 'text-red-600' : 'text-green-600'}`}>
                                        {test.result.result_value} {test.unit}
                                    </span>
                                    {test.result.is_abnormal && (
                                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full">ABNORMAL</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {labResults.tests?.length > 6 && (
                    <p className="text-sm text-blue-600 text-center">
                        +{labResults.tests.length - 6} more tests
                    </p>
                )}
            </div>
        </div>
    );
};

export default LabResultsSection;
