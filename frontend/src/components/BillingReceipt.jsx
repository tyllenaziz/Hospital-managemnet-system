import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, AlertCircle } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { resolveAssetUrl } from '../utils/assetUrl';

const BillReceipt = () => {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    fetchBillData();
  }, [billId]);

  useEffect(() => {
    if (billData) {
      // Create readable text for QR code
      const readableData = `
Name: ${billData.patient_name}
Patient Number: ${billData.patient_number}
OP Visit Date: ${formatDate(billData.created_at)}
Bill No: BILL-${billData.id}
Doctor: ${billData.doctor_name || billData.created_by_name || 'N/A'}
Invoice No: INV-${billData.id}
Invoice Date: ${formatDate(billData.created_at)}
Consultation Fee: KES ${formatCurrency(billData.consultation_fee || 0)}
Lab Fee: KES ${formatCurrency(billData.lab_fee || 0)}
Pharmacy Fee: KES ${formatCurrency(billData.pharmacy_fee || 0)}
Total Amount: KES ${formatCurrency(billData.total_amount || billData.final_amount || 0)}
      `.trim();
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(readableData)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [billData]);

  const fetchBillData = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/bills/${billId}`);
      
      if (!response.ok) {
        throw new Error('Bill not found');
      }

      const data = await response.json();
      setBillData(data.bill || data);
    } catch (err) {
      console.error('Error fetching bill:', err);
      setError(err.message || 'Failed to load bill');
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

  if (error || !billData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'Bill not found'}</p>
          <button
            onClick={() => navigate('/reception/billing')}
            className="px-4 py-2 border border-gray-800 text-gray-800 hover:bg-gray-100 rounded"
          >
            Back to Billing
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = billData.total_amount || billData.final_amount || 0;
  const hospitalInfo = billData.hospital || null;

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
      <div className="max-w-4xl mx-auto p-8 print:p-4">
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

        {/* Patient/Receipt Details */}
        <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
          {/* Left Column */}
          <div>
            <div className="mb-2">
              <span className="font-semibold">Name:</span>
              <span className="ml-2">{billData.patient_name}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Patient Number:</span>
              <span className="ml-2">{billData.patient_number}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">OP Visit Date:</span>
              <span className="ml-2">{formatDate(billData.created_at)}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Bill No:</span>
              <span className="ml-2">BILL-{billData.id}</span>
            </div>
            
            {billData.doctor_name && (
              <div className="mb-2">
                <span className="font-semibold">Doctor:</span>
                <span className="ml-2">Dr. {billData.doctor_name}</span>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="text-right">
            <div className="mb-2">
              <span className="font-semibold">Invoice No:</span>
              <span className="ml-2">INV-{billData.id}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Invoice Date:</span>
              <span className="ml-2">{formatDate(billData.created_at)}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Consultation Fee:</span>
              <span>KES {formatCurrency(billData.consultation_fee || 0)}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Lab Fee:</span>
              <span>KES {formatCurrency(billData.lab_fee || 0)}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Pharmacy Fee:</span>
              <span>KES {formatCurrency(billData.pharmacy_fee || 0)}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Total Amount:</span>
              <span className="ml-2">KES {formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Detailed Invoice Table */}
        <div className="mb-6">
          <h3 className="text-sm font-bold mb-2 text-center">DETAILED INVOICE</h3>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-t border-b border-gray-800">
                <th className="text-left py-1 font-semibold">CATEGORY</th>
                <th className="text-left py-1 font-semibold">DESCRIPTION</th>
                <th className="text-right py-1 font-semibold">QTY</th>
                <th className="text-right py-1 font-semibold">RATE(KES)</th>
                <th className="text-right py-1 font-semibold">AMOUNT(KES)</th>
              </tr>
            </thead>
            <tbody>
              {/* Consultation */}
              {billData.consultation_fee > 0 && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 align-top">
                    <div className="font-semibold">Consultation</div>
                  </td>
                  <td className="py-2 align-top">
                    <div className="font-semibold mb-1">Doctor Consultation</div>
                  </td>
                  <td className="text-right py-2 align-top">1</td>
                  <td className="text-right py-2 align-top">
                    {formatCurrency(billData.consultation_fee)}
                  </td>
                  <td className="text-right py-2 align-top font-semibold">
                    {formatCurrency(billData.consultation_fee)}
                  </td>
                </tr>
              )}

              {/* Lab Tests */}
              {billData.lab_fee > 0 && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 align-top">
                    <div className="font-semibold">Laboratory</div>
                  </td>
                  <td className="py-2 align-top">
                    <div className="font-semibold mb-1">Laboratory Tests</div>
                  </td>
                  <td className="text-right py-2 align-top">1</td>
                  <td className="text-right py-2 align-top">
                    {formatCurrency(billData.lab_fee)}
                  </td>
                  <td className="text-right py-2 align-top font-semibold">
                    {formatCurrency(billData.lab_fee)}
                  </td>
                </tr>
              )}

              {/* Pharmacy */}
              {billData.pharmacy_fee > 0 && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 align-top">
                    <div className="font-semibold">Pharmacy</div>
                  </td>
                  <td className="py-2 align-top">
                    <div className="font-semibold mb-1">Pharmacy Medicines</div>
                  </td>
                  <td className="text-right py-2 align-top">1</td>
                  <td className="text-right py-2 align-top">
                    {formatCurrency(billData.pharmacy_fee)}
                  </td>
                  <td className="text-right py-2 align-top font-semibold">
                    {formatCurrency(billData.pharmacy_fee)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown */}
        <div className="mb-6 text-xs">
          <div className="grid grid-cols-2 gap-8">
            <div></div>
            <div className="space-y-1">
              {billData.consultation_fee > 0 && (
                <div className="flex justify-between">
                  <span>Consultation Fee:</span>
                  <span>KES {formatCurrency(billData.consultation_fee)}</span>
                </div>
              )}
              {billData.lab_fee > 0 && (
                <div className="flex justify-between">
                  <span>Laboratory Fee:</span>
                  <span>KES {formatCurrency(billData.lab_fee)}</span>
                </div>
              )}
              {billData.pharmacy_fee > 0 && (
                <div className="flex justify-between">
                  <span>Pharmacy Fee:</span>
                  <span>KES {formatCurrency(billData.pharmacy_fee)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-gray-400">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-semibold">KES {formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t-2 border-gray-800">
                <span className="font-bold">Total Amount:</span>
                <span className="font-bold">KES {formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="mb-6 text-xs border-t pt-2">
          <span className="font-semibold italic">Amount in Words: </span>
          <span className="italic">{amountInWords(totalAmount)}</span>
        </div>

        {/* Payment Method */}
        {billData.payment_method && (
          <div className="mb-4 text-xs text-center">
            <span className="font-semibold">Payment Method: </span>
            <span className="uppercase">{billData.payment_method}</span>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-xs">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-semibold">Served By:</span>
              <span className="ml-2">{billData.created_by_name || 'SYSTEM'}</span>
              <p>Record updated successfully in {hospitalInfo?.name || 'the system'}</p>
              <p><span className="font-semibold">Date Time:</span> {new Date(billData.created_at).toLocaleString('en-KE')}</p>
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

export default BillReceipt;
