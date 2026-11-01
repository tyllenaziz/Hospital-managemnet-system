import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileText, Pill, AlertCircle, CheckCircle, Barcode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const PrescriptionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dispensing, setDispensing] = useState(false);

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

  const handleDispense = async () => {
    if (!prescription || prescription.status !== 'pending') return;

    setDispensing(true);
    setError(null);

    try {
      // Prepare items for dispensing (using barcode from medicine data)
      const items = prescription.items.map(item => ({
        barcode: item.barcode,
        quantity: item.quantity
      }));

      const response = await authenticatedFetch(
        `${API_BASE_URL}/prescriptions/${id}/dispense`,
        {
          method: 'POST',
          body: JSON.stringify({
            items,
            payment_method: 'cash'
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        await fetchPrescriptionDetails();
        toast.success('Prescription dispensed successfully');
      }
    } catch (err) {
      console.error('Error dispensing prescription:', err);
      setError(err.message || 'Failed to dispense prescription');
    } finally {
      setDispensing(false);
    }
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

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="mx-auto text-slate-300 mb-4" size={64} />
          <h3 className="text-slate-800 font-semibold mb-2">Prescription not found</h3>
          <p className="text-slate-600 mb-4">{error || 'Unable to load prescription'}</p>
          <button
            onClick={() => navigate('/pharmacy/prescriptions')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-medium"
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = prescription.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/pharmacy/prescriptions')}
          className="flex items-center gap-2 text-slate-600 hover:text-teal-700 transition font-medium"
        >
          <ArrowLeft size={20} />
          Back to Prescriptions
        </button>

        {/* Prescription Header */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-green-600 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Prescription #{prescription.id}
                </h1>
                <p className="text-teal-100">Patient: {prescription.patient_name}</p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {prescription.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Doctor</p>
                <p className="text-slate-800 font-semibold">{prescription.doctor_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-slate-600 text-sm">Date</p>
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
                <p className="text-slate-600 text-sm">Total Amount</p>
                <p className="text-slate-800 font-semibold">KES {totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Information */}
        {(prescription.diagnosis || prescription.notes) && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Clinical Information</h2>
            {prescription.diagnosis && (
              <div className="mb-4">
                <p className="text-slate-600 text-sm mb-1">Diagnosis</p>
                <p className="text-slate-800">{prescription.diagnosis}</p>
              </div>
            )}
            {prescription.notes && (
              <div>
                <p className="text-slate-600 text-sm mb-1">Notes</p>
                <p className="text-slate-800">{prescription.notes}</p>
              </div>
            )}
          </div>
        )}

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
                    <div className="flex items-center gap-2 mt-1">
                      <Barcode size={16} className="text-slate-600" />
                      <span className="text-slate-600 font-mono text-sm">{item.barcode}</span>
                    </div>
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
                    <p className="text-slate-800 font-medium">KES {item.price}</p>
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

        {/* Action Button */}
        {prescription.status === 'pending' && (
          <div className="bg-white rounded-xl border border-blue-200 shadow-md p-6">
            <button
              onClick={handleDispense}
              disabled={dispensing}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg shadow-md transition-all"
            >
              {dispensing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Dispensing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Dispense Prescription</span>
                </>
              )}
            </button>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-3 flex items-center gap-2 text-red-700">
                <AlertCircle size={18} />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetails;
