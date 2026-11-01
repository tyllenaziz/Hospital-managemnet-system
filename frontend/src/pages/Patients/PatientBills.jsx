import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Receipt, Search, Calendar, User, AlertCircle, RefreshCw, Printer, Phone, IdCard, CreditCard, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import BillPaymentModal from '../../components/BillPaymentModal';

const PatientBills = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();

  const [patient, setPatient] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [expandedVisits, setExpandedVisits] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    fetchPatientBills();
  }, [patientId]);

  const fetchPatientBills = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/bills/patient/${patientId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch patient bills');
      }

      const data = await response.json();

      let billsArray = [];
      let patientInfo = null;

      if (Array.isArray(data)) {
        billsArray = data;
        if (data.length > 0) {
          patientInfo = {
            patient_number: data[0].patient_number,
            patient_name: data[0].patient_name,
            phone: data[0].phone,
            gender: data[0].gender,
            age: data[0].age
          };
        }
      } else if (data.bills) {
        billsArray = data.bills;
        patientInfo = data.patient || (billsArray.length > 0 ? {
          patient_number: billsArray[0].patient_number,
          patient_name: billsArray[0].patient_name,
          phone: billsArray[0].phone,
          gender: billsArray[0].gender,
          age: billsArray[0].age
        } : null);
      }

      setPatient(patientInfo);
      setBills(billsArray);
    } catch (err) {
      console.error('Error fetching patient bills:', err);
      setError(err.message || 'Failed to load patient bills');
    } finally {
      setLoading(false);
    }
  };

  // Group bills by visit date (same date = same visit)
  const visitGroups = useMemo(() => {
    const groups = {};

    bills.forEach(bill => {
      const visitDate = new Date(bill.created_at).toLocaleDateString('en-KE');

      if (!groups[visitDate]) {
        groups[visitDate] = {
          date: visitDate,
          dateTime: new Date(bill.created_at),
          bills: [],
          totalConsultation: 0,
          totalLab: 0,
          totalPharmacy: 0,
          totalAmount: 0,
          allItems: [],
          payment_status: 'paid', // Will be updated
          doctor_name: bill.doctor_name,
          patient_name: bill.patient_name,
          patient_number: bill.patient_number,
          phone: bill.phone
        };
      }

      const group = groups[visitDate];
      group.bills.push(bill);
      group.totalConsultation += parseFloat(bill.consultation_fee) || 0;
      group.totalLab += parseFloat(bill.lab_fee) || 0;
      group.totalPharmacy += parseFloat(bill.pharmacy_fee) || 0;
      group.totalAmount += parseFloat(bill.final_amount || bill.total_amount) || 0;

      // Collect all items
      if (bill.items) {
        group.allItems.push(...bill.items);
      }

      // If any bill is pending/partial, the visit is unpaid
      if (bill.payment_status === 'pending' || bill.payment_status === 'partial') {
        group.payment_status = 'pending';
      }
    });

    // Sort by date descending
    return Object.values(groups).sort((a, b) => b.dateTime - a.dateTime);
  }, [bills]);

  // Filter visits by status
  const filteredVisits = useMemo(() => {
    if (statusFilter === 'all') return visitGroups;
    return visitGroups.filter(visit => visit.payment_status === statusFilter);
  }, [visitGroups, statusFilter]);

  const toggleVisitExpand = (date) => {
    setExpandedVisits(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const handlePayVisit = (visit) => {
    // Create a consolidated bill object for payment
    const consolidatedBill = {
      id: visit.bills.map(b => b.id).join(','), // Multiple bill IDs
      billIds: visit.bills.map(b => b.id),
      patient_name: visit.patient_name,
      patient_number: visit.patient_number,
      phone: visit.phone,
      consultation_fee: visit.totalConsultation,
      lab_fee: visit.totalLab,
      pharmacy_fee: visit.totalPharmacy,
      total_amount: visit.totalAmount,
      final_amount: visit.totalAmount,
      amount_paid: 0,
      payment_status: visit.payment_status,
      items: visit.allItems,
      isConsolidated: true
    };

    setSelectedVisit(consolidatedBill);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (data) => {
    showToast(`Payment of KES ${data.totalPaid || selectedVisit?.total_amount} received successfully!`);
    fetchPatientBills();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-gray-600 mt-4">Loading patient bills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600" size={24} />
            <div>
              <h3 className="font-semibold text-red-800 text-lg">Error Loading Bills</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPatientBills}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/reception/billing')}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Back to Billing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/reception/billing')}
              className="p-2 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Patient Bills</h1>
              {patient && (
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="flex items-center gap-1">
                    <User size={16} />
                    <span className="font-medium">{patient.patient_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone size={14} />
                    <span>{patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IdCard size={14} />
                    <span>#{patient.patient_number}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/reception/patient-bills-receipt/${patientId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Printer size={18} />
              Print All
            </button>
            <button
              onClick={fetchPatientBills}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Visits</p>
                <p className="text-2xl font-bold text-slate-800">{visitGroups.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Paid Visits</p>
                <p className="text-2xl font-bold text-green-600">
                  {visitGroups.filter(v => v.payment_status === 'paid').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Pending Visits</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {visitGroups.filter(v => v.payment_status !== 'paid').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Receipt className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm">Total Outstanding</p>
                <p className="text-2xl font-bold text-purple-600">
                  KES {visitGroups
                    .filter(v => v.payment_status !== 'paid')
                    .reduce((sum, v) => sum + v.totalAmount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Visits</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            <span className="text-sm text-gray-500">
              Showing {filteredVisits.length} of {visitGroups.length} visits
            </span>
          </div>
        </div>

        {/* Visits List */}
        <div className="space-y-4">
          {filteredVisits.length === 0 ? (
            <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-12 text-center">
              <Receipt size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-600 font-semibold mb-2">No visits found</h3>
              <p className="text-gray-500 text-sm">No billing records for this patient</p>
            </div>
          ) : (
            filteredVisits.map((visit) => (
              <div key={visit.date} className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
                {/* Visit Header */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calendar className="text-teal-600" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">
                          Visit: {new Date(visit.dateTime).toLocaleDateString('en-KE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-sm text-slate-600">
                          Doctor: {visit.doctor_name || 'N/A'} • {visit.bills.length} bill(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-2xl font-bold text-slate-800">
                          KES {visit.totalAmount.toLocaleString()}
                        </p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${visit.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {visit.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                      </span>

                      {visit.payment_status !== 'paid' && (
                        <button
                          onClick={() => handlePayVisit(visit)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                        >
                          <CreditCard size={18} />
                          Pay Now
                        </button>
                      )}

                      <button
                        onClick={() => navigate(`/reception/bill-receipt/${visit.bills[0]?.id || visit.bill_ids?.[0]}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                        title="View Receipt"
                      >
                        <Eye size={18} />
                        Receipt
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="p-4 grid grid-cols-4 gap-4 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Consultation</p>
                    <p className="text-lg font-semibold text-blue-600">
                      KES {visit.totalConsultation.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Lab Tests</p>
                    <p className="text-lg font-semibold text-purple-600">
                      KES {visit.totalLab.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Pharmacy</p>
                    <p className="text-lg font-semibold text-orange-600">
                      KES {visit.totalPharmacy.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Total</p>
                    <p className="text-lg font-bold text-slate-800">
                      KES {visit.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Expandable Items */}
                <div>
                  <button
                    onClick={() => toggleVisitExpand(visit.date)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    <span>View Itemized Charges ({visit.allItems.length} items)</span>
                    {expandedVisits[visit.date] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {expandedVisits[visit.date] && (
                    <div className="px-4 pb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Item</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Qty</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Price</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {visit.allItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-800">
                                {item.medicine_name || item.description || 'N/A'}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.type === 'consultation' ? 'bg-blue-100 text-blue-700' :
                                  item.type === 'medicine' ? 'bg-orange-100 text-orange-700' :
                                    item.type === 'lab_test' ? 'bg-purple-100 text-purple-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-gray-600">
                                KES {parseFloat(item.unit_price || 0).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-gray-800">
                                KES {parseFloat(item.subtotal || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedVisit && (
          <BillPaymentModal
            bill={selectedVisit}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedVisit(null);
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              } text-white`}>
              <CheckCircle size={20} />
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
                className="ml-2 hover:opacity-80"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientBills;