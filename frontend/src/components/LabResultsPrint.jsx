import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';

const LabResultsPrint = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [labData, setLabData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabResults();
  }, [orderId]);

  const fetchLabResults = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/lab/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setLabData(data);
      }
    } catch (err) {
      console.error('Error fetching lab results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Get the actual order date from the data
  const getOrderDate = () => {
    if (!labData) return '';
    // Try order_date first, then fall back to created_at
    const dateString = labData.order_date || labData.created_at;
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  // Group unique remarks to avoid duplicates
  const getUniqueRemarks = (parameters) => {
    const remarksMap = new Map();
    
    parameters.forEach(param => {
      if (param.result?.remarks && param.result.remarks.trim()) {
        const remark = param.result.remarks.trim();
        if (!remarksMap.has(remark)) {
          remarksMap.set(remark, [param.parameter_name]);
        } else {
          remarksMap.get(remark).push(param.parameter_name);
        }
      }
    });
    
    return remarksMap;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="text-gray-600 mt-4">Loading lab results...</p>
        </div>
      </div>
    );
  }

  if (!labData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Lab results not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-800 text-gray-800 hover:bg-gray-100 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:min-h-0">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-800 text-gray-800 hover:bg-gray-100 rounded"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 rounded"
        >
          <Printer size={18} />
          Print
        </button>
      </div>

      {/* Lab Results Content */}
      <div className="max-w-4xl mx-auto p-6 print:p-4 print:max-w-none">
        {/* Header with Logo */}
        <div className="text-center mb-4 pb-4 border-b-2 border-gray-900 print:mb-2 print:pb-2">
          <img 
            src={`${import.meta.env.BASE_URL}logo.png`} 
            alt="Hospital Logo" 
            className="h-16 mx-auto mb-2 print:h-12"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          
          {/* Contact Information */}
          <div className="text-center text-xs text-gray-700">
            <p className="font-bold">BENSMMA MEDICAL PHARMACY AND LAB LTD</p>
            <p>Po box 983-60200 Meru, Kenya</p>
            <p>Tel: +254102222555 | +2540116222555</p>
            <p>Email: support@bensmma.co.ke</p>
            <p className="mt-1">Website: www.bensmma.co.ke</p>
          </div>
        </div>

        {/* Report Type and Number */}
        <div className="mb-4 text-center print:mb-2">
          <h2 className="text-xl font-bold text-gray-900 mb-1 print:text-lg">LABORATORY REPORT</h2>
          <div className="inline-block border border-gray-900 px-3 py-1 print:px-2 print:py-1">
            <p className="text-xs font-semibold print:text-[10px]">
              Lab Order No: <span className="font-mono">LAB{orderId}</span>
            </p>
            <p className="text-xs print:text-[10px]">
              Report Date: {new Date().toLocaleString('en-KE', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Patient Information - Compact Horizontal Layout */}
        <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
          <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Patient Information</h3>
          <div className="grid grid-cols-4 gap-2 text-xs print:text-[10px]">
            <div>
              <p className="text-gray-600">Name:</p>
              <p className="font-semibold text-gray-900">{labData.patient_name}</p>
            </div>
            <div>
              <p className="text-gray-600">Patient Number:</p>
              <p className="font-semibold text-gray-900">{labData.patient_number}</p>
            </div>
            <div>
              <p className="text-gray-600">Order Date:</p>
              <p className="font-semibold text-gray-900">{getOrderDate()}</p>
            </div>
            <div>
              <p className="text-gray-600">Status:</p>
              <p className="font-semibold text-gray-900 uppercase">{labData.status}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1 text-xs print:text-[10px]">
            <div>
              <p className="text-gray-600">Ordered By:</p>
              <p className="font-semibold text-gray-900">Dr. {labData.doctor_name}</p>
            </div>
            <div>
              <p className="text-gray-600">Department:</p>
              <p className="font-semibold text-gray-900">Laboratory</p>
            </div>
          </div>
        </div>

        {/* Clinical Notes */}
        {labData.notes && labData.notes.trim() && (
          <div className="mb-2 pb-1 border-b border-gray-400">
            <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Clinical Notes</h3>
            <p className="text-xs text-gray-900 print:text-[10px] whitespace-pre-wrap">{labData.notes}</p>
          </div>
        )}

        {/* Lab Tests and Results */}
        <div className="mb-3 print:mb-2">
          <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide print:text-[10px]">
            Test Results ({labData.tests?.length || 0} Tests)
          </h3>
          
          {labData.tests?.map((test, testIndex) => (
            <div key={test.item_id} className="mb-4 print:mb-3 border border-gray-900">
              {/* Test Header */}
              <div className="bg-gray-900 text-white px-2 py-1 print:px-1 print:py-0.5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold print:text-xs">{test.test_name}</h4>
                    <p className="text-xs print:text-[10px]">{test.category} • Code: {test.test_code}</p>
                  </div>
                  {test.item_status === 'completed' && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium print:text-[10px]">
                      COMPLETED
                    </span>
                  )}
                </div>
              </div>

              {/* Parameters Table */}
              <table className="w-full border-collapse text-xs print:text-[10px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-900">
                    <th className="px-2 py-1 text-left font-bold uppercase border-r border-gray-300">Parameter</th>
                    <th className="px-2 py-1 text-right font-bold uppercase border-r border-gray-300">Result</th>
                    <th className="px-2 py-1 text-left font-bold uppercase border-r border-gray-300">Unit</th>
                    <th className="px-2 py-1 text-left font-bold uppercase border-r border-gray-300">Normal Range</th>
                    <th className="px-2 py-1 text-center font-bold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {test.parameters?.map((param, paramIndex) => (
                    <tr 
                      key={param.param_id} 
                      className={`${
                        param.result?.is_abnormal ? 'bg-red-50' : paramIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } border-b border-gray-300`}
                    >
                      <td className="px-2 py-1 font-medium text-gray-900 border-r border-gray-300">
                        {param.parameter_name}
                      </td>
                      <td className="px-2 py-1 font-bold text-gray-900 text-right border-r border-gray-300">
                        {param.result?.result_value || '-'}
                      </td>
                      <td className="px-2 py-1 text-gray-700 border-r border-gray-300">
                        {param.unit || '-'}
                      </td>
                      <td className="px-2 py-1 text-gray-700 border-r border-gray-300">
                        {param.normal_range || '-'}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {param.result?.is_abnormal ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs font-medium print:text-[9px]">
                            ABNORMAL
                          </span>
                        ) : param.result ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium print:text-[9px]">
                            NORMAL
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium print:text-[9px]">
                            PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Remarks - Grouped by unique remarks */}
              {test.parameters?.some(param => param.result?.remarks) && (
                <div className="bg-blue-50 border-t border-gray-300 px-2 py-2 print:py-1">
                  <h5 className="text-xs font-bold text-gray-900 mb-1 print:text-[10px]">Remarks:</h5>
                  {Array.from(getUniqueRemarks(test.parameters)).map(([remark, params], index) => (
                    <div key={index} className="text-xs text-gray-800 mb-1 print:text-[10px]">
                      <span className="font-semibold">
                        {params.length === 1 ? params[0] : params.length === test.parameters.length ? 'General' : params.join(', ')}:
                      </span> {remark}
                    </div>
                  ))}
                </div>
              )}

              {/* Test Info */}
              {test.parameters?.[0]?.result?.tested_at && (
                <div className="bg-gray-50 border-t border-gray-300 px-2 py-1 text-xs text-gray-600 print:text-[10px]">
                  Tested on {new Date(test.parameters[0].result.tested_at).toLocaleString('en-KE')}
                  {test.parameters[0].result.tested_by && ` by ${test.parameters[0].result.tested_by}`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-900 text-center print:mt-2 print:pt-2">
          <p className="text-xs font-semibold text-gray-900 mb-1 print:text-[10px]">
            Thank you for choosing Bensmma Hospital
          </p>
          <p className="text-[10px] text-gray-700 mb-1 print:text-[9px]">
            For any questions regarding these results, please consult your physician
          </p>
          <p className="text-[10px] text-gray-600 print:text-[9px]">
            This is a computer-generated report. No signature required.
          </p>
        </div>



        {/* Confidentiality Notice */}
        <div className="mt-4 border border-gray-400 bg-gray-50 p-2 print:mt-2">
          <p className="text-[9px] text-gray-700 text-center print:text-[8px]">
            <strong>CONFIDENTIAL:</strong> This laboratory report contains confidential patient information. 
            Unauthorized disclosure or distribution is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LabResultsPrint;
