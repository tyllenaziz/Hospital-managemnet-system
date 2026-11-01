import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileText, Pill, AlertCircle, Barcode, Edit, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DoctorPrescriptionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchPrescriptionDetails();
  }, [id]);

  const fetchPrescriptionDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/prescriptions/${id}`);
      const data = await response.json();
      setPrescription(data);
    } catch (err) {
      console.error('Error fetching prescription:', err);
      setError(err.message || 'Failed to load prescription details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrescription = () => {
    if (!prescription || !prescription.queue_id) {
      setError('Cannot edit: Queue information not available');
      return;
    }

    // Check if user is a doctor
    if (user?.role !== 'doctor') {
      setError('Only doctors can edit prescriptions');
      return;
    }

    // Check if this doctor owns the prescription
    if (prescription.doctor_id !== user?.id) {
      setError('You can only edit your own prescriptions');
      return;
    }

    // Check if prescription is still editable (pending status)
    if (prescription.status !== 'pending') {
      setError('Cannot edit: Prescription has already been dispensed or cancelled');
      return;
    }

    // Navigate to consultation page with queue_id to reopen
    navigate(`/doctor/consultation/${prescription.queue_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-slate-600 mt-4">Loading prescription details...</p>
        </div>
      </div>
    );
  }

  if (error && !prescription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-slate-800 font-semibold mb-2">Prescription not found</h3>
          <p className="text-slate-600 mb-4">{error || 'Unable to load prescription'}</p>
          <button
            onClick={() => navigate('/doctor/prescriptions')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-medium"
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = prescription.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  
  // Check if current user can edit this prescription
  const canEdit = user?.role === 'doctor' && 
                  prescription?.doctor_id === user?.id && 
                  prescription?.status === 'pending';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/doctor/prescriptions')}
          className="flex items-center gap-2 text-slate-600 hover:text-teal-700 transition font-medium"
        >
          <ArrowLeft size={20} />
          Back to My Prescriptions
        </button>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
            <div className="flex-1">
              <p className="text-green-700 font-medium text-sm">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && prescription && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <div className="flex-1">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Prescription Header */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
          <div className="bg-teal-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Prescription #{prescription.id}
                </h1>
                <p className="text-teal-100">Patient: {prescription.patient_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    prescription.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : prescription.status === "dispensed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {prescription.status.toUpperCase()}
                </span>
                {canEdit && (
                  <button
                    onClick={handleEditPrescription}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-teal-50 text-teal-700 font-medium rounded-lg shadow-sm transition border border-teal-200"
                  >
                    <Edit size={18} />
                    Edit Prescription
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Patient</p>
                <p className="text-slate-800 font-semibold">
                  {prescription.patient_name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Date Issued</p>
                <p className="text-slate-800 font-semibold">
                  {new Date(prescription.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Total Value</p>
                <p className="text-slate-800 font-semibold">
                  KES {totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Permission Notice */}
          {prescription.status === 'pending' && prescription.doctor_id !== user?.id && (
            <div className="px-6 pb-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> This prescription was created by Dr. {prescription.doctor_name || 'Another Doctor'}. Only the prescribing doctor can edit it.
                </p>
              </div>
            </div>
          )}

          {prescription.status !== 'pending' && (
            <div className="px-6 pb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> This prescription has been {prescription.status} and can no longer be edited.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Information */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Clinical Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prescription.diagnosis && (
              <div>
                <p className="text-slate-600 text-sm mb-1">Diagnosis</p>
                <p className="text-slate-800 bg-blue-50 p-3 rounded-lg">{prescription.diagnosis}</p>
              </div>
            )}
            {prescription.notes && (
              <div>
                <p className="text-slate-600 text-sm mb-1">Clinical Notes</p>
                <p className="text-slate-800 bg-blue-50 p-3 rounded-lg">{prescription.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Prescription Items */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-md overflow-hidden">
          <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Pill className="text-teal-600" size={24} />
              Prescribed Medicines ({prescription.items?.length || 0})
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {prescription.items?.map((item, index) => (
              <div key={index} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{item.medicine_name}</h3>
                    {item.custom_medicine_name && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mt-1 inline-block">
                        Custom Medicine
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600 text-sm">Quantity</p>
                    <p className="text-xl font-bold text-teal-600">{item.quantity}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">Dosage</p>
                    <p className="text-slate-800 font-medium">{item.dosage || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Duration</p>
                    <p className="text-slate-800 font-medium">{item.duration || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Unit Price</p>
                    <p className="text-slate-800 font-medium">
                      {item.price ? `KES ${item.price}` : 'N/A'}
                    </p>
                  </div>
                </div>
                {item.instructions && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-slate-600 text-sm">Instructions</p>
                    <p className="text-slate-800">{item.instructions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPrescriptionDetails;