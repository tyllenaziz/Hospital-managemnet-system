import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Building2, User, Calendar, Phone, Mail, FileText, 
  Activity, Pill, TestTube, Stethoscope, AlertCircle, CheckCircle, 
  XCircle, Clock, Edit, Trash2, Download, Printer, X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

const ReferralDetailsPage = () => {
  const { authenticatedFetch, API_BASE_URL, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    fetchReferralDetails();
  }, [id]);

  useEffect(() => {
    if (referral) {
      // Create human-readable text for QR code
      const readableData = `
        MEDICAL REFERRAL
        

        Referral No: REF-${referral.id}
        Date: ${new Date(referral.created_at).toLocaleDateString('en-US')}

        PATIENT INFORMATION
        -------------------
        Name: ${referral.patient_name}
        Age: ${referral.age} years
        Gender: ${referral.patient_gender}

        REFERRAL DETAILS
        ----------------
        From: ${referral.referring_hospital}
        Doctor: ${referral.referring_doctor_name}
        Phone: ${referral.referring_doctor_phone}

        To: ${referral.referred_to_hospital}
        Department: ${referral.referred_to_department}

        Priority: ${referral.priority}
        Diagnosis: ${referral.diagnosis}

        Reason: ${referral.referral_reason}

        
        Official Medical Referral Document
              `.trim();
              
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(readableData)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [referral]);

  const fetchReferralDetails = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/referrals/${id}`);
      const data = await response.json();

      if (data.success) {
        setReferral(data.referral);
      } else {
        setError(data.error || 'Failed to fetch referral details');
      }
    } catch (err) {
      console.error('Error fetching referral:', err);
      setError('Failed to load referral details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/referrals/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, feedback })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Status updated successfully');
        setShowStatusModal(false);
        setNewStatus('');
        setFeedback('');
        fetchReferralDetails();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this referral?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/referrals/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Referral deleted successfully');
        navigate('/doctor/referrals');
      } else {
        alert(data.error || 'Failed to delete referral');
      }
    } catch (err) {
      console.error('Error deleting referral:', err);
      alert('Failed to delete referral');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Accepted': 'bg-green-100 text-green-800 border-green-300',
      'Rejected': 'bg-red-100 text-red-800 border-red-300',
      'Completed': 'bg-blue-100 text-blue-800 border-blue-300',
      'Cancelled': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Emergency': 'bg-red-600 text-white',
      'Urgent': 'bg-orange-600 text-white',
      'Routine': 'bg-blue-600 text-white'
    };
    return colors[priority] || 'bg-gray-600 text-white';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading referral details...</p>
        </div>
      </div>
    );
  }

  if (error || !referral) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-red-600 mx-auto mb-3" size={48} />
          <p className="text-gray-800 text-lg font-semibold mb-2">Error Loading Referral</p>
          <p className="text-gray-600 mb-4">{error || 'Referral not found'}</p>
          <button
            onClick={() => navigate('/doctor/referrals')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
          >
            Back to Referrals
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 15mm;
            size: A4;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 print:bg-white print:min-h-0">
        {/* Print Controls - Hidden when printing */}
        <div className="print:hidden bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 no-print">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate('/doctor/referrals')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            
            <div className="flex gap-2">
              {referral.status === 'Pending' && (
                <>
                  <button
                    onClick={() => navigate(`/doctor/referrals/${id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
                  >
                    <Edit size={18} />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition shadow-sm"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-sm"
              >
                <CheckCircle size={18} />
                Update Status
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-lg transition shadow-sm"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Printable Referral Letter */}
        <div className="print-content max-w-4xl mx-auto p-6 print:p-4 print:max-w-none">
          {/* Header with Logo and QR Code */}
          <div className="text-center mb-4 pb-4 border-b-2 border-gray-900 print:mb-2 print:pb-2">
            <div className="flex justify-between items-start">
              <div className="flex-1"></div>
              <div className="flex-1 text-center">
                <img 
                  src="/logo.png" 
                  alt="Hospital Logo" 
                  className="h-16 mx-auto mb-2 print:h-12"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <h1 className="text-xl font-bold text-gray-900 print:text-lg">{referral.referring_hospital}</h1>
                <p className="text-xs text-gray-600 print:text-[10px]">P.O. Box 1234-00100, Nairobi, Kenya</p>
                <p className="text-xs text-gray-600 print:text-[10px]">Tel: +254 700 000 000 | Email: info@hospital.com</p>
              </div>
              <div className="flex-1 flex justify-end">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 border border-gray-300 print:w-16 print:h-16" />
                )}
              </div>
            </div>
          </div>

          {/* Document Title and Info */}
          <div className="mb-4 text-center print:mb-2">
            <h2 className="text-xl font-bold text-gray-900 mb-1 print:text-lg">MEDICAL REFERRAL LETTER</h2>
            <div className="inline-block border border-gray-900 px-3 py-1 print:px-2 print:py-1">
              <p className="text-xs font-semibold print:text-[10px]">
                Referral No: <span className="font-mono">REF-{id}</span>
              </p>
              <p className="text-xs print:text-[10px]">
                Date: {formatDateShort(referral.created_at)}
              </p>
            </div>
          </div>

          {/* Priority Banner */}
          {referral.priority === 'Emergency' && (
            <div className="bg-red-100 border-l-4 border-red-600 p-3 mb-3 print:p-2 print:mb-2">
              <p className="text-red-800 font-bold text-sm print:text-xs">EMERGENCY REFERRAL - IMMEDIATE ATTENTION REQUIRED</p>
            </div>
          )}
          {referral.priority === 'Urgent' && (
            <div className="bg-orange-100 border-l-4 border-orange-600 p-3 mb-3 print:p-2 print:mb-2">
              <p className="text-orange-800 font-semibold text-sm print:text-xs"> URGENT REFERRAL - PRIORITY ATTENTION NEEDED</p>
            </div>
          )}

          {/* To Section */}
          <div className="mb-3 print:mb-2">
            <p className="text-xs font-bold text-gray-900 mb-1 print:text-[10px]">TO:</p>
            <p className="text-xs text-gray-900 ml-4 print:text-[10px]">{referral.referred_to_hospital}</p>
            {referral.referred_to_department && (
              <p className="text-xs text-gray-900 ml-4 print:text-[10px]">Department of {referral.referred_to_department}</p>
            )}
          </div>

          {/* Subject */}
          <div className="mb-3 print:mb-2">
            <p className="text-xs font-bold text-gray-900 print:text-[10px]">RE: PATIENT REFERRAL</p>
          </div>

          {/* Salutation */}
          <div className="mb-3 print:mb-2">
            <p className="text-xs text-gray-900 print:text-[10px]">Dear Medical Colleague,</p>
          </div>

          {/* Introduction */}
          <div className="mb-3 print:mb-2">
            <p className="text-xs text-gray-900 leading-relaxed print:text-[10px]">
              I am writing to refer the following patient to your facility for specialized medical care and evaluation.
            </p>
          </div>

          {/* Patient Information - Compact Grid */}
          <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
            <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Patient Information</h3>
            <div className="grid grid-cols-4 gap-2 text-xs print:text-[10px]">
              <div>
                <p className="text-gray-600">Name:</p>
                <p className="font-semibold text-gray-900">{referral.patient_name}</p>
              </div>
              <div>
                <p className="text-gray-600">Patient ID:</p>
                <p className="font-semibold text-gray-900">{referral.patient_id}</p>
              </div>
              {referral.patient_age && (
                <div>
                  <p className="text-gray-600">Age:</p>
                  <p className="font-semibold text-gray-900">{referral.patient_age} years</p>
                </div>
              )}
              {referral.patient_gender && (
                <div>
                  <p className="text-gray-600">Gender:</p>
                  <p className="font-semibold text-gray-900">{referral.patient_gender}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reason for Referral */}
          <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
            <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Reason for Referral</h3>
            <p className="text-xs text-gray-900 leading-relaxed print:text-[10px]">{referral.referral_reason}</p>
          </div>

          {/* Diagnosis */}
          {referral.diagnosis && (
            <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Diagnosis</h3>
              <p className="text-xs text-gray-900 leading-relaxed print:text-[10px]">{referral.diagnosis}</p>
            </div>
          )}

          {/* Clinical Summary */}
          <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
            <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Clinical Summary</h3>
            <p className="text-xs text-gray-900 leading-relaxed whitespace-pre-wrap print:text-[10px]">{referral.clinical_summary}</p>
          </div>

          {/* Patient Condition */}
          {referral.patient_condition && (
            <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Patient Condition</h3>
              <p className="text-xs text-gray-900 print:text-[10px]">{referral.patient_condition}</p>
            </div>
          )}

          {/* Vital Signs */}
          {referral.vital_signs && (
            <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Vital Signs</h3>
              <div className="grid grid-cols-3 gap-2 text-xs print:text-[10px]">
                {(() => {
                  let vitalSigns = referral.vital_signs;
                  if (typeof vitalSigns === 'string') {
                    try {
                      vitalSigns = JSON.parse(vitalSigns);
                    } catch (error) {
                      return <p className="text-gray-900 col-span-3">{vitalSigns}</p>;
                    }
                  }
                  if (typeof vitalSigns === 'object' && vitalSigns !== null) {
                    return Object.entries(vitalSigns).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-1 rounded">
                        <p className="text-[10px] text-gray-600 capitalize print:text-[9px]">{key.replace(/_/g, ' ')}</p>
                        <p className="font-semibold text-gray-900">{value}</p>
                      </div>
                    ));
                  }
                  return <p className="text-gray-900 col-span-3">{vitalSigns}</p>;
                })()}
              </div>
            </div>
          )}

          {/* Investigations Done */}
          {referral.investigations_done && (
            <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Investigations Completed</h3>
              <div className="space-y-1">
                {(() => {
                  let investigations = [];
                  if (Array.isArray(referral.investigations_done)) {
                    investigations = referral.investigations_done;
                  } else if (typeof referral.investigations_done === 'string') {
                    try {
                      investigations = JSON.parse(referral.investigations_done);
                      if (!Array.isArray(investigations)) investigations = [investigations];
                    } catch (error) {
                      investigations = [referral.investigations_done];
                    }
                  }
                  return investigations.map((inv, index) => (
                    <div key={index} className="border-l-2 border-teal-600 pl-2 py-1 bg-gray-50 print:border-l">
                      {typeof inv === 'object' ? (
                        <>
                          <p className="font-semibold text-gray-900 text-xs print:text-[10px]">{inv.test || 'Test'}</p>
                          <p className="text-gray-700 text-[10px] print:text-[9px]">{inv.result || 'No result'}</p>
                        </>
                      ) : (
                        <p className="text-gray-900 text-xs print:text-[10px]">{inv}</p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Current Medications */}
          {referral.current_medications && (
            <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Current Medications</h3>
              <ul className="list-disc list-inside space-y-0.5 text-xs print:text-[10px]">
                {(() => {
                  let medications = [];
                  if (Array.isArray(referral.current_medications)) {
                    medications = referral.current_medications;
                  } else if (typeof referral.current_medications === 'string') {
                    try {
                      medications = JSON.parse(referral.current_medications);
                      if (!Array.isArray(medications)) medications = [medications];
                    } catch (error) {
                      medications = [referral.current_medications];
                    }
                  }
                  return medications.map((med, index) => (
                    <li key={index} className="text-gray-900">{med}</li>
                  ));
                })()}
              </ul>
            </div>
          )}

          {/* Services Requested */}
          {referral.services_needed && referral.services_needed.length > 0 && (
            <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Services Requested</h3>
              <ul className="list-disc list-inside space-y-0.5 text-xs print:text-[10px]">
                {referral.services_needed.map((service, index) => (
                  <li key={index} className="text-gray-900">{service}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Expected Visit Date */}
          {referral.expected_visit_date && (
            <div className="mb-3 pb-2 border-b border-gray-400 print:mb-2">
              <h3 className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wide print:text-[10px]">Expected Visit Date</h3>
              <p className="text-xs text-gray-900 print:text-[10px]">{formatDateShort(referral.expected_visit_date)}</p>
            </div>
          )}

          {/* Closing */}
          <div className="mb-3 print:mb-2">
            <p className="text-xs text-gray-900 leading-relaxed print:text-[10px]">
              I would greatly appreciate your expert evaluation and management of this patient. Please do not hesitate to contact me should you require any additional information or clarification regarding this referral.
            </p>
          </div>

          {referral.follow_up_required && (
            <div className="mb-3 bg-blue-50 border border-blue-200 p-2 rounded print:mb-2">
              <p className="text-blue-800 font-semibold text-xs print:text-[10px]">Follow-up required: Please provide feedback on patient outcome</p>
            </div>
          )}

          {/* Signature Section */}
          <div className="mt-6 pt-3 border-t border-gray-900 print:mt-4 print:pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-900 text-sm print:text-xs">{referral.referring_doctor_name}</p>
                <p className="text-gray-600 text-xs print:text-[10px]">{referral.referring_hospital}</p>
                <p className="text-gray-600 text-xs print:text-[10px] flex items-center gap-1 mt-1">
                  <Phone size={10} />
                  {referral.referring_doctor_phone}
                </p>
                {referral.referring_doctor_email && (
                  <p className="text-gray-600 text-xs print:text-[10px] flex items-center gap-1">
                    <Mail size={10} />
                    {referral.referring_doctor_email}
                  </p>
                )}
              </div>

                <div className="text-right min-h-[80px] flex flex-col justify-end">
                    <div className="border-t-2 border-gray-900 w-40 ml-auto mb-1"></div>
                    <p className="text-gray-600 text-xs print:text-[10px]">Signature & Stamp</p>
                    <p className="text-gray-600 text-xs print:text-[10px]">{formatDateShort(referral.created_at)}</p>
                </div>

            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-400 text-center print:mt-3 print:pt-2">
            <p className="text-xs font-semibold text-gray-900 mb-1 print:text-[10px]">Thank you for your cooperation</p>
            <p className="text-[10px] text-gray-600 print:text-[9px]">
              This is an official medical referral document. Please verify authenticity using the QR code above.
            </p>
            <p className="text-[10px] text-gray-600 mt-1 print:text-[9px]">
              Document ID: REF-{referral.id} | Generated: {formatDateShort(referral.created_at)}
            </p>
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Update Referral Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select status</option>
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Add any feedback or notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || !newStatus}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReferralDetailsPage;