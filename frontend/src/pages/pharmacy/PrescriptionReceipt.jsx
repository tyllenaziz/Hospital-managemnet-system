import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { resolveAssetUrl } from '../../utils/assetUrl';

const PrescriptionReceipt = () => {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceiptData();
  }, [prescriptionId]);

  const fetchReceiptData = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/prescriptions/${prescriptionId}/receipt`);
      const data = await response.json();
      setReceipt(data);
    } catch (err) {
      console.error('Error fetching receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotal = () => {
    if (!receipt?.items) return 0;
    return receipt.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-gray-600 mt-4">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Receipt not found</p>
          <button
            onClick={() => navigate('/pharmacy/dispensed')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
          >
            Back to Dispensed List
          </button>
        </div>
      </div>
    );
  }

  const hospitalInfo = receipt.hospital || null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Print Controls - Hidden when printing */}
        <div className="print:hidden flex justify-between items-center">
          <button
            onClick={() => navigate('/pharmacy/dispensed')}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-700 transition font-medium text-sm"
          >
            <ArrowLeft size={18} />
            Back to Dispensed List
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
          >
            <Printer size={18} />
            Print Receipt
          </button>
        </div>

        {/* Receipt Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-6 pb-6 border-b-2 border-gray-300">
            {hospitalInfo?.logo_path && (
              <img 
                src={resolveAssetUrl(hospitalInfo.logo_path)}
                alt="Hospital Logo" 
                className="h-16 mx-auto mb-2"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
            <h1 className="text-3xl font-bold text-gray-800 mb-2">PHARMACY RECEIPT</h1>
            <p className="text-gray-600">{hospitalInfo?.name || 'Hospital Management System'}</p>
            {hospitalInfo?.phone && <p className="text-sm text-gray-500">Tel: {hospitalInfo.phone}</p>}
            <p className="text-sm text-gray-500 mt-2">
              Date: {new Date(receipt.updated_at).toLocaleString()}
            </p>
          </div>

          {/* Patient & Prescription Info */}
          <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Patient Information</h3>
              <p className="text-gray-800 font-medium">{receipt.patient_name}</p>
              <p className="text-sm text-gray-600">Phone: {receipt.patient_phone || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Prescription Details</h3>
              <p className="text-gray-800">Prescription #: <span className="font-mono font-semibold">#{receipt.id}</span></p>
              <p className="text-sm text-gray-600">Doctor: Dr. {receipt.doctor_name}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dispensed Medicines</h3>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Medicine</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Dosage</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Price</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receipt.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-800">{item.medicine_name}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{item.dosage}</td>
                    <td className="px-3 py-2 text-sm text-gray-800 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-sm text-gray-800 text-right">KES {parseFloat(item.price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-gray-800 text-right font-semibold">
                      KES {(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Instructions */}
          {receipt.items?.some(item => item.instructions) && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Instructions</h3>
              {receipt.items.map((item, index) => (
                item.instructions && (
                  <div key={index} className="mb-2">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{item.medicine_name}:</span> {item.instructions}
                    </p>
                    <p className="text-xs text-gray-600">Duration: {item.duration}</p>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-300">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">TOTAL AMOUNT</span>
              <span className="text-2xl font-bold text-teal-600">
                KES {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p className="mb-2">Thank you for choosing {hospitalInfo?.name || 'our pharmacy'}</p>
            <p className="text-xs">Please take your medicines as prescribed by the doctor</p>
            <p className="text-xs mt-4">This is a computer-generated receipt</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionReceipt;
