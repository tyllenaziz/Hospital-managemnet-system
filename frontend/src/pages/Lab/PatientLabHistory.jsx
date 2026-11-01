import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, AlertCircle, User, Calendar, FileText, Printer } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const PatientLabHistory = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [labHistory, setLabHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientLabHistory();
  }, [patientId]);

  const fetchPatientLabHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/lab/results/patient/${patientId}`
      );
      const data = await response.json();
      setLabHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching patient lab history:', err);
      setError(err.message || 'Failed to load lab history');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (orderId) => {
    // Navigate to print lab results page with orderId
    navigate(`/patient/${orderId}/lab-results/print`); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-slate-600 mt-4">Loading lab history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-teal-700 transition font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Patient Lab History</h1>
              <p className="text-slate-600">Complete laboratory test history and results</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Patient ID: {patientId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Lab History */}
        {labHistory.length === 0 ? (
          <div className="bg-white rounded-xl border border-blue-200 shadow-md p-12 text-center">
            <FlaskConical className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-slate-800 font-semibold mb-2">No lab history</h3>
            <p className="text-slate-600">This patient has no lab test records</p>
          </div>
        ) : (
          <div className="space-y-6">
            {labHistory.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-blue-200 shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        Lab Order #{order.id}
                      </h3>
                      <p className="text-slate-600">
                        {new Date(order.order_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                          onClick={() => handlePrint(order.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white hover:bg-teal-700 rounded transition-colors text-xs font-medium"
                        >
                          <Printer size={16} />
                          Print
                        </button>
                      </div>
                      <p className="text-slate-600 text-sm">Dr. {order.doctor_name}</p>
                    </div>
                  </div>
                </div>

                {/* Order Info */}
                <div className="p-6 border-b border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="text-blue-600" size={18} />
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Patient</p>
                        <p className="text-slate-800 font-semibold text-sm">{order.patient_name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="text-purple-600" size={18} />
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Order Date</p>
                        <p className="text-slate-800 font-semibold text-sm">
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="text-green-600" size={18} />
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Ordered By</p>
                        <p className="text-slate-800 font-semibold text-sm">Dr. {order.doctor_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                {order.notes && (
                  <div className="p-6 border-b border-blue-100 bg-amber-50">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2">Clinical Notes</h4>
                    <p className="text-amber-900 text-sm">{order.notes}</p>
                  </div>
                )}

                {/* Lab Tests */}
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FlaskConical className="text-teal-600" size={20} />
                    <h4 className="text-lg font-bold text-slate-800">Lab Tests ({order.tests?.length || 0})</h4>
                  </div>

                  {order.tests?.map((test) => (
                    <div key={test.item_id} className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-5 border border-blue-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="text-lg font-bold text-slate-800">{test.test_name}</h5>
                          <p className="text-slate-600 text-sm">{test.category} • Code: {test.test_code}</p>
                        </div>
                        {test.item_status === 'completed' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-300">
                            COMPLETED
                          </span>
                        )}
                      </div>

                      {/* Results Table */}
                      <div className="bg-white rounded-lg p-5 border border-blue-200">
                        <h6 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">
                          Test Results
                        </h6>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b-2 border-blue-200">
                                <th className="text-left py-2 px-3 text-slate-700 font-semibold">Parameter</th>
                                <th className="text-left py-2 px-3 text-slate-700 font-semibold">Result</th>
                                <th className="text-left py-2 px-3 text-slate-700 font-semibold">Unit</th>
                                <th className="text-left py-2 px-3 text-slate-700 font-semibold">Normal Range</th>
                                <th className="text-center py-2 px-3 text-slate-700 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {test.parameters?.map((param) => (
                                <tr 
                                  key={param.param_id} 
                                  className={`border-b border-blue-100 ${
                                    param.result?.is_abnormal ? 'bg-red-50' : ''
                                  }`}
                                >
                                  <td className="py-3 px-3 font-medium text-slate-800">
                                    {param.parameter_name}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-slate-900">
                                    {param.result?.result_value || '-'}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600">
                                    {param.unit || '-'}
                                  </td>
                                  <td className="py-3 px-3 text-slate-600 text-xs">
                                    {param.normal_range || '-'}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    {param.result?.is_abnormal ? (
                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                        ABNORMAL
                                      </span>
                                    ) : param.result ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        NORMAL
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                        PENDING
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Remarks */}
                        {test.parameters?.some(param => param.result?.remarks) && (
                          <div className="mt-4 space-y-2">
                            {test.parameters.map((param) => 
                              param.result?.remarks ? (
                                <div key={param.param_id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-slate-700 text-sm">
                                    <span className="font-semibold">{param.parameter_name} Remarks:</span> {param.result.remarks}
                                  </p>
                                </div>
                              ) : null
                            )}
                          </div>
                        )}

                        {/* Tested Info */}
                        {test.parameters?.[0]?.result?.tested_at && (
                          <div className="mt-4 pt-3 border-t border-blue-200">
                            <p className="text-slate-500 text-xs">
                              Tested on {new Date(test.parameters[0].result.tested_at).toLocaleString()} 
                              {test.parameters[0].result.tested_by && ` by ${test.parameters[0].result.tested_by}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientLabHistory;