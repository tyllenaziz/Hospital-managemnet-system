import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, FileText, Pill, Save, Printer, AlertCircle, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const DispensePrescription = () => {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [patient, setPatient] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [dispensing, setDispensing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatientAndPrescription();
    fetchMedicines();
  }, [queueId]);

  const fetchPatientAndPrescription = async () => {
    try {
      setLoading(true);
      
      const queueResponse = await authenticatedFetch(`${API_BASE_URL}/queue/pharmacy?status=waiting`);
      const queueData = await queueResponse.json();
      const queueItem = queueData.find(q => q.id === parseInt(queueId));
      
      if (!queueItem) throw new Error('Queue item not found');
      
      setPatient(queueItem);

      if (!queueItem.patient_id) throw new Error('Patient ID not found');

      const prescriptionResponse = await authenticatedFetch(
        `${API_BASE_URL}/prescriptions/patient/${queueItem.patient_id}/latest`
      );
      
      if (!prescriptionResponse.ok) {
        if (prescriptionResponse.status === 404) {
          setError('No pending prescription found for this patient');
          setPrescription(null);
          return;
        }
        throw new Error(`HTTP error! status: ${prescriptionResponse.status}`);
      }
      
      const prescriptionData = await prescriptionResponse.json();
      setPrescription(prescriptionData);

      // Initialize dispensing array with custom medicine support
      if (prescriptionData && prescriptionData.items) {
        const initialDispensing = prescriptionData.items.map(item => ({
          ...item,
          dispensed_quantity: item.quantity,
          // For custom medicines, total_price is the total amount for all units
          // For inventory medicines, calculate from unit price
          total_price: item.custom_medicine_name && !item.price 
            ? 0 
            : (item.price ? item.price * item.quantity : 0),
          is_custom: !!item.custom_medicine_name,
          in_stock: true
        }));
        setDispensing(initialDispensing);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/medicines`);
      const data = await response.json();
      const medicinesArray = Array.isArray(data) ? data : (data.medicines || []);
      setMedicines(medicinesArray);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const value = newQuantity === '' ? 0 : parseInt(newQuantity);
    setDispensing(prev => prev.map((item, i) =>
      i === index ? { ...item, dispensed_quantity: Math.max(0, value) } : item
    ));
  };

  const handlePriceChange = (index, newPrice) => {
    const value = newPrice === '' ? 0 : parseFloat(newPrice);
    setDispensing(prev => prev.map((item, i) =>
      i === index ? { ...item, total_price: Math.max(0, value) } : item
    ));
  };

  const handleIncrement = (index) => {
    setDispensing(prev => prev.map((item, i) =>
      i === index ? { ...item, dispensed_quantity: item.dispensed_quantity + 1 } : item
    ));
  };

  const handleDecrement = (index) => {
    setDispensing(prev => prev.map((item, i) =>
      i === index ? { ...item, dispensed_quantity: Math.max(0, item.dispensed_quantity - 1) } : item
    ));
  };

  const getMedicineStock = (medicineId) => {
    if (!medicineId) return Infinity; // Custom medicines have unlimited "stock"
    const medicine = medicines.find(m => m.id === medicineId);
    return medicine ? medicine.stock : 0;
  };

  const getItemPrice = (item) => {
    // For custom medicines, use total_price (total for all units)
    // For inventory medicines, calculate total from unit price
    if (item.is_custom) {
      return item.total_price || 0;
    }
    return (parseFloat(item.price) || 0) * item.dispensed_quantity;
  };

  const calculateTotal = () => {
    return dispensing.reduce((sum, item) => {
      return sum + getItemPrice(item);
    }, 0);
  };

  const handleDispense = async () => {
    setSaving(true);
    setError(null);

    try {
      // Update medicine stock only for inventory medicines
      for (const item of dispensing) {
        if (item.dispensed_quantity > 0 && item.medicine_id) {
          const medicine = medicines.find(m => m.id === item.medicine_id);
          if (medicine) {
            const newStock = medicine.stock - item.dispensed_quantity;
            await authenticatedFetch(`${API_BASE_URL}/medicines/${item.medicine_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...medicine, stock: newStock })
            });
          }
        }
      }

      // Create bill
      const billData = {
        patient_id: patient.patient_id,
        queue_id: queueId,
        consultation_fee: 0
      };

      const billResponse = await authenticatedFetch(`${API_BASE_URL}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
      });

      const billResult = await billResponse.json();
      if (!billResult.success) throw new Error('Failed to create bill');

      const billId = billResult.bill.id;

      // FIXED: Add medicines to bill with correct total prices
      const addMedicinesResponse = await authenticatedFetch(
        `${API_BASE_URL}/bills/${billId}/medicines`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prescription_id: prescription.id,
            custom_items: dispensing.map(item => {
              // For custom medicines: use total_price directly
              // For inventory medicines: calculate from unit price * quantity
              const totalPrice = item.is_custom 
                ? (item.total_price || 0)
                : ((item.price || 0) * item.dispensed_quantity);

              return {
                medicine_id: item.medicine_id,
                custom_medicine_name: item.custom_medicine_name,
                quantity: item.dispensed_quantity,
                total_price: totalPrice
              };
            })
          })
        }
      );

      const medicinesResult = await addMedicinesResponse.json();
      if (!medicinesResult.success) throw new Error('Failed to add medicines to bill');

      // Update prescription status
      await authenticatedFetch(`${API_BASE_URL}/prescriptions/${prescription.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dispensed' })
      });

      // Update queue status
      await authenticatedFetch(`${API_BASE_URL}/queue/${queueId}/pharmacy-complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispensedMedicine: dispensing.map(d => 
            `${d.medicine_name || d.custom_medicine_name} x${d.dispensed_quantity}`
          ).join(', ')
        })
      });

      toast.success('Prescription dispensed successfully');
      navigate(`/pharmacy/receipt/${prescription.id}`);
    } catch (err) {
      console.error('Error dispensing:', err);
      setError(err.message || 'Failed to dispense prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-gray-600 mt-4">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <FileText className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-gray-800 font-semibold mb-2">No prescription found</h3>
          <p className="text-gray-600 mb-4">{error || "This patient doesn't have a prescription"}</p>
          <button
            onClick={() => navigate('/pharmacy/dashboard')}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <button
          onClick={() => navigate('/pharmacy/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-700 transition font-medium text-sm"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Patient Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{patient?.name}</h2>
              <p className="text-gray-600 text-sm">{patient?.age} yrs • {patient?.gender} • {patient?.phone}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Prescription Details */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Pill className="text-teal-600" size={20} />
              Prescription #{prescription.id}
            </h2>
            <p className="text-gray-600 text-sm mt-1">Dr. {prescription.doctor_name}</p>
          </div>

          {prescription.diagnosis && (
            <div className="p-4 bg-blue-50 border-b border-gray-200">
              <p className="text-sm text-gray-700"><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
            </div>
          )}

          {/* Medicine Items */}
          <div className="p-4 space-y-3">
            {dispensing.map((item, index) => {
              const availableStock = getMedicineStock(item.medicine_id);
              const canDispense = item.is_custom || availableStock >= item.dispensed_quantity;
              const itemTotalPrice = getItemPrice(item);

              return (
                <div key={index} className={`rounded-lg p-4 border-2 ${canDispense ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {item.medicine_name || item.custom_medicine_name}
                        {item.is_custom && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Custom</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{item.dosage} • {item.duration}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.instructions}</p>
                      {!item.is_custom && (
                        <p className="text-sm text-gray-600 mt-2">
                          Available Stock: <span className={`font-semibold ${canDispense ? 'text-green-600' : 'text-red-600'}`}>{availableStock}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800 mt-1">
                        KES {itemTotalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Quantity {item.is_custom && <span className="text-xs text-gray-500">(e.g., tablets)</span>}:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDecrement(index)}
                          className="p-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                          disabled={item.dispensed_quantity <= 0}
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          value={item.dispensed_quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                          min="0"
                        />
                        <button
                          onClick={() => handleIncrement(index)}
                          className="p-1 bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {item.is_custom ? 'Total Price (KES):' : 'Price per unit (KES):'}
                      </label>
                      <input
                        type="number"
                        value={item.is_custom ? (item.total_price || 0) : (item.price || 0)}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="0.01"
                        disabled={!item.is_custom && item.medicine_id}
                      />
                      {item.is_custom && (
                        <p className="text-xs text-gray-500 mt-1">
                          Total for {item.dispensed_quantity} units
                        </p>
                      )}
                    </div>
                  </div>

                  {!canDispense && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Insufficient stock</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="p-4 border-t-2 border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
              <span className="text-2xl font-bold text-teal-600">KES {calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={handleDispense}
              disabled={saving || dispensing.some(item => {
                if (item.is_custom) return false;
                const availableStock = getMedicineStock(item.medicine_id);
                return availableStock < item.dispensed_quantity;
              })}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Dispensing...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Dispense & Complete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispensePrescription;
