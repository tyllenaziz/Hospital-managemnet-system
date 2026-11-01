import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, AlertCircle } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { resolveAssetUrl } from '../utils/assetUrl';

const PatientBillsReceipt = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const printRef = useRef();
  
  const [patient, setPatient] = useState(null);
  const [bills, setBills] = useState([]);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    fetchPatientBills();
  }, [patientId]);

  useEffect(() => {
    if (patient && bills.length > 0) {
      const totals = calculateTotals();
      // Create readable text for QR code
      const readableData = `
Name: ${patient.patient_name}
Patient Number: ${patient.patient_number}
Statement Date: ${formatDate(new Date())}
Total Bills: ${bills.length}
Consultation Fee: KES ${formatCurrency(totals.consultationTotal)}
Lab Fee: KES ${formatCurrency(totals.labTotal)}
Pharmacy Fee: KES ${formatCurrency(totals.pharmacyTotal)}
Total Amount: KES ${formatCurrency(totals.totalAmount)}
      `.trim();
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(readableData)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [patient, bills]);

  const fetchPatientBills = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/bills/patient/${patientId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient bills');
      }

      const data = await response.json();
      
      if (data.success && data.bills) {
        const sortedBills = data.bills.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );

        // Store hospital info from response
        if (data.hospital) {
          setHospitalInfo(data.hospital);
        }

        // Extract patient info from first bill
        if (sortedBills.length > 0) {
        const billWithDoctor = sortedBills.find(bill => bill.doctor_name) || sortedBills[0];
        setPatient({
          patient_id: billWithDoctor.patient_id,
          patient_name: billWithDoctor.patient_name,
          patient_number: billWithDoctor.patient_number,
          doctor_name: billWithDoctor.doctor_name,
          phone: billWithDoctor.phone,
          age: billWithDoctor.age,
          gender: billWithDoctor.gender
        });
      }

        setBills(sortedBills);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching patient bills:', err);
      setError(err.message || 'Failed to load patient bills');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toFixed(2);
  };

  const calculateTotals = () => {
    // Consultation fee should only be counted once
    const consultationTotal = bills.length > 0 ? parseFloat(bills[0].consultation_fee) || 0 : 0;
    const labTotal = bills.reduce((sum, b) => sum + (parseFloat(b.lab_fee) || 0), 0);
    const pharmacyTotal = bills.reduce((sum, b) => sum + (parseFloat(b.pharmacy_fee) || 0), 0);
    const totalAmount = consultationTotal + labTotal + pharmacyTotal;
    
    return {
      totalAmount,
      consultationTotal,
      labTotal,
      pharmacyTotal
    };
  };

  const totals = calculateTotals();

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    if (num >= 20 && num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num >= 100 && num < 1000) {
      return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
    }
    if (num >= 1000 && num < 1000000) {
      return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    }
    return num.toString();
  };

  const amountInWords = (amount) => {
    const shillings = Math.floor(amount);
    const cents = Math.round((amount - shillings) * 100);
    
    let words = numberToWords(shillings) + ' Shillings';
    if (cents > 0) {
      words += ' and ' + numberToWords(cents) + ' Cents';
    }
    return words + ' Only';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          <p className="text-gray-600 mt-4">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={24} />
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
          </div>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white print:min-h-0">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.3cm;
            size: A4;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Print Controls */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-10 no-print">
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

      {/* Receipt Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-4" ref={printRef}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          {/* Logo */}
          <div className="flex-1">
            {hospitalInfo?.logo_path ? (
              <img 
                src={resolveAssetUrl(hospitalInfo.logo_path)}
                alt="Hospital Logo" 
                className="h-20 mb-2"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <img 
                src={`${import.meta.env.BASE_URL}logo.png`} 
                alt="Hospital Logo" 
                className="h-20 mb-2"
                onError={(e) => e.target.style.display = 'none'}
              />
            )}
          </div>
          
          {/* Contact Information */}
          <div className="text-right text-xs text-gray-700">
            <p className="font-bold">{hospitalInfo?.name || 'Hospital'}</p>
            {hospitalInfo?.address && <p>{hospitalInfo.address}</p>}
            <p>{hospitalInfo?.city || ''}{hospitalInfo?.county ? `, ${hospitalInfo.county}` : ''}{hospitalInfo?.country ? `, ${hospitalInfo.country}` : ''}</p>
            {hospitalInfo?.phone && <p>Tel: {hospitalInfo.phone}</p>}
            {hospitalInfo?.alternative_phone && <p>Tel: {hospitalInfo.alternative_phone}</p>}
            {hospitalInfo?.email && <p>Email: {hospitalInfo.email}</p>}
            {hospitalInfo?.website && <p className="mt-1">Website: {hospitalInfo.website}</p>}
          </div>
        </div>

        
        {/* Patient Details */}
      <div className="mb-6 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-2">
              <span className="font-semibold">Name:</span>
              <span className="ml-2">{patient?.patient_name || 'N/A'}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Patient Number:</span>
              <span className="ml-2">{patient?.patient_number}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Phone:</span>
              <span className="ml-2">{patient?.phone || 'N/A'}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Dr:</span>
              <span className="ml-2">{patient?.doctor_name}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <span className="font-semibold">Statement Date:</span>
              <span className="ml-2">{formatDate(new Date())}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Total Bills:</span>
              <span className="ml-2">{bills.length}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Invoice No:</span>
              <span className="ml-2">INV-{bills[0]?.id || 'N/A'}</span> {/* Use first bill ID */}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Invoice Date:</span>
              <span className="ml-2">{formatDate(bills[0]?.created_at || new Date())}</span> {/* Use first bill date */}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Consultation Fee:</span>
              <span>KES {formatCurrency(totals.consultationTotal)}</span> {/* Use calculated totals */}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Lab Fee:</span>
              <span>KES {formatCurrency(totals.labTotal)}</span> {/* Use calculated totals */}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Pharmacy Fee:</span>
              <span>KES {formatCurrency(totals.pharmacyTotal)}</span> {/* Use calculated totals */}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Total Amount:</span>
              <span className="ml-2">KES {formatCurrency(totals.totalAmount)}</span> {/* Use calculated totals */}
            </div>
          </div>
        </div>
      </div>

        {/* Detailed Invoice Table */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-2 text-center">COMPREHENSIVE BILLING STATEMENT</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-t border-b border-gray-800">
                <th className="text-left py-1 font-semibold">BILL DATE</th>
                <th className="text-left py-1 font-semibold">BILL NO.</th>
                <th className="text-left py-1 font-semibold">DESCRIPTION</th>
                <th className="text-right py-1 font-semibold">QTY</th>
                <th className="text-right py-1 font-semibold">RATE(KES)</th>
                <th className="text-right py-1 font-semibold">AMOUNT(KES)</th>
              </tr>
            </thead>
            <tbody>
              {/* Show consultation only once at the top */}
              {bills.length > 0 && bills[0].consultation_fee > 0 && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 align-top">
                    <div className="font-semibold">Consultation</div>
                    <div>{formatDate(bills[0].created_at)}</div>
                  </td>
                  <td className="py-2 align-top">#{bills[0].id}</td>
                  <td className="py-2 align-top">GENERAL OPD DOCTORS - GENERAL PRACTICE</td>
                  <td className="text-right py-2 align-top">1.00</td>
                  <td className="text-right py-2 align-top">{formatCurrency(bills[0].consultation_fee)}</td>
                  <td className="text-right py-2 align-top font-semibold">{formatCurrency(bills[0].consultation_fee)}</td>
                </tr>
              )}

              {/* Show all items from all bills */}
              {bills.map((bill) => (
                <React.Fragment key={bill.id}>
                  {bill.items?.filter(item => item.type !== 'consultation').map((item) => (
                    <tr key={item.item_id} className="border-b border-gray-300">
                      <td className="py-2 align-top">
                        <div className="font-semibold">
                          {item.type === 'lab_test' ? 'Laboratory' : 
                           item.type === 'medicine' || item.type === 'custom_medicine' ? 'Medicine' : 
                           item.type}
                        </div>
                        <div>{formatDate(bill.created_at)}</div>
                      </td>
                      <td className="py-2 align-top">#{bill.id}</td>
                      <td className="py-2 align-top">
                        <div>{item.description || item.medicine_name || 'N/A'}</div>
                       
                      </td>
                      <td className="text-right py-2 align-top">{item.quantity}</td>
                      <td className="text-right py-2 align-top">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right py-2 align-top font-semibold">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="mb-6 text-xs">
          <span className="font-semibold italic">KES </span>
          <span className="italic">{amountInWords(totals.totalAmount)}</span>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
          <div></div>
          <div className="text-right">
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Consultation Total:</span>
              <span className="font-semibold">{formatCurrency(totals.consultationTotal)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Laboratory Total:</span>
              <span className="font-semibold">{formatCurrency(totals.labTotal)}</span>
            </div>
            <div className="flex justify-between mb-1 pb-1 border-b border-gray-400">
              <span className="font-semibold">Pharmacy Total:</span>
              <span className="font-semibold">{formatCurrency(totals.pharmacyTotal)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Total Amount(KES):</span>
              <span className="font-semibold">{formatCurrency(totals.totalAmount)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Total Copay(KES):</span>
              <span className="font-semibold">{formatCurrency(totals.totalAmount)}</span>
            </div>
            <div className="flex justify-between pb-1 border-b-2 border-gray-800">
              <span className="font-semibold">Amount Payable(KES):</span>
              <span className="font-semibold">{formatCurrency(totals.totalAmount)}</span>
            </div>
          </div>
        </div>

      
       
        {/* Footer Info */}
        <div className="mt-8 text-xs">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-semibold">Served By:</span>
              <span className="ml-2">{user?.username || user?.name || 'N/A'}</span>
              <p>Record updated successfully in {hospitalInfo?.name || 'the system'}</p>
              <p><span className="font-semibold">Date Time:</span> {new Date().toLocaleString('en-KE')}</p>
            </div>
            
            <div className="flex items-start gap-8">
              {/* Patient Signature */}
              <div>
                <span className="font-semibold">Patient's Signature:</span>
                <span className="ml-2">_________________</span>
              </div>
              
              {/* QR Code Section */}
              {qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Receipt QR Code" 
                    className="w-20 h-20 border border-gray-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientBillsReceipt;
