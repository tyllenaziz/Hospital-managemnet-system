import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { resolveAssetUrl } from '../utils/assetUrl';

const Receipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiptType, setReceiptType] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    fetchReceiptData();
  }, [id]);

  useEffect(() => {
    if (receiptData) {
      // Create readable text for QR code
      const readableData = `
Name: ${receiptData.patient_name}
Patient Number: ${receiptData.patient_number}
OP Visit Date: ${formatDate(receiptData.created_at || Date.now())}
Bill No: BILL-${receiptData.bill_id}
Doctor: Dr. ${receiptData.doctor_name || 'N/A'}
Invoice No: INV-${receiptData.bill_id}
Invoice Date: ${formatDate(receiptData.created_at || receiptData.updated_at || Date.now())}
Consultation Fee: KES ${formatCurrency(receiptData.summary?.consultation_fee || 0)}
Lab Fee: KES ${formatCurrency(receiptData.summary?.lab_fee || 0)}
Pharmacy Fee: KES ${formatCurrency(receiptData.summary?.pharmacy_fee || 0)}
Total Amount: KES ${formatCurrency(receiptData.total_amount || receiptData.summary?.final_amount || 0)}
      `.trim();
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(readableData)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [receiptData]);

  const fetchReceiptData = async () => {
    try {
      let response = await authenticatedFetch(`${API_BASE_URL}/prescriptions/${id}/receipt`);
      
      if (response.ok) {
        const data = await response.json();
        setReceiptData(data);
        setReceiptType('prescription');
      } else {
        response = await authenticatedFetch(`${API_BASE_URL}/sales/${id}`);
        if (response.ok) {
          const data = await response.json();
          setReceiptData(data);
          setReceiptType('sale');
        }
      }
    } catch (err) {
      console.error('Error fetching receipt:', err);
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

  // Get item display name based on type
  const getItemDisplayName = (item) => {
    if (item.type === 'consultation') {
      return 'Doctor Consultation';
    } else if (item.type === 'lab_test') {
      return item.description;
    } else if (item.type === 'medicine') {
      return item.medicine_name || item.custom_medicine_name || item.description || 'Medicine';
    }
    return item.description || 'Item';
  };

  // Get category label
  const getCategoryLabel = (type) => {
    switch(type) {
      case 'consultation': return 'Consultation';
      case 'lab_test': return 'Laboratory';
      case 'medicine': return 'Pharmacy';
      default: return 'Pharmacy';
    }
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

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Receipt not found</p>
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

  const totalAmount = receiptData.total_amount || receiptData.summary?.final_amount || 0;
  const hospitalInfo = receiptData.hospital || null;

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
            font-size: 10px;
            line-height: 1.2;
          }
          .no-print {
            display: none !important;
          }
          .print-compact * {
            margin: 0 !important;
            padding: 0 !important;
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
          {/* Logo and Hospital Info */}
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
              <span className="ml-2">{receiptData.patient_name}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Patient Number:</span>
              <span className="ml-2">{receiptData.patient_number}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">OP Visit Date:</span>
              <span className="ml-2">{formatDate(receiptData.created_at || Date.now())}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Bill No:</span>
              <span className="ml-2">BILL-{receiptData.bill_id}</span>
            </div>
            
            {receiptData.doctor_name && (
              <div className="mb-2">
                <span className="font-semibold">Doctor:</span>
                <span className="ml-2">Dr. {receiptData.doctor_name}</span>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="text-right">
            <div className="mb-2">
              <span className="font-semibold">Invoice No:</span>
              <span className="ml-2">INV-{receiptData.bill_id}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Invoice Date:</span>
              <span className="ml-2">{formatDate(receiptData.created_at || receiptData.updated_at || Date.now())}</span>
            </div>

            <div className="mb-2">
              <span className="font-semibold">Consultation Fee:</span>
              <span>KES {formatCurrency(receiptData.summary.consultation_fee)}</span>
            </div>

            <div className="mb-2">
              <span className="font-semibold">Lab Fee:</span>
              <span>KES {formatCurrency(receiptData.summary.lab_fee)}</span>
            </div>

            <div className="mb-2">
              <span className="font-semibold">Pharmacy Fee:</span>
              <span>KES {formatCurrency(receiptData.summary.pharmacy_fee)}</span>
            </div>

            <div className="mb-2">
              <span className="font-semibold">Total Amount:</span>
              <span className="ml-2">KES {formatCurrency(totalAmount)}</span>
            </div>
            
          </div>
        </div>

        {/* Doctor's Notes */}
        {receiptData.notes && (
          <div className="mb-4 text-xs">
            <span className="font-semibold">Doctor's Notes:</span>
            <span className="ml-2">{receiptData.notes}</span>
          </div>
        )}

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
              {receiptData.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="py-2 align-top">
                    <div className="font-semibold">{getCategoryLabel(item.type)}</div>
                  </td>
                  <td className="py-2 align-top">
                    <div className="font-semibold mb-1">
                      {getItemDisplayName(item)}
                    </div>
                    
                  </td>
                  <td className="text-right py-2 align-top">{item.quantity}</td>
                  <td className="text-right py-2 align-top">
                    {formatCurrency(item.unit_price || item.price || 0)}
                  </td>
                  <td className="text-right py-2 align-top font-semibold">
                    {formatCurrency(item.subtotal || (item.unit_price * item.quantity) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown */}
        {receiptData.summary && (
          <div className="mb-6 text-xs">
            <div className="grid grid-cols-2 gap-8">
              <div></div>
              <div className="space-y-1">
                {receiptData.summary.consultation_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Consultation Fee:</span>
                    <span>KES {formatCurrency(receiptData.summary.consultation_fee)}</span>
                  </div>
                )}
                {receiptData.summary.lab_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Laboratory Fee:</span>
                    <span>KES {formatCurrency(receiptData.summary.lab_fee)}</span>
                  </div>
                )}
                {receiptData.summary.pharmacy_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Pharmacy Fee:</span>
                    <span>KES {formatCurrency(receiptData.summary.pharmacy_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-gray-400">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-semibold">KES {formatCurrency(receiptData.summary.subtotal)}</span>
                </div>
                {receiptData.summary.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>- KES {formatCurrency(receiptData.summary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t-2 border-gray-800">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-bold">KES {formatCurrency(receiptData.summary.final_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amount in Words */}
        <div className="mb-6 text-xs border-t pt-2">
          <span className="font-semibold italic">Amount in Words: </span>
          <span className="italic">{amountInWords(totalAmount)}</span>
        </div>

        {/* Payment Method */}
        {receiptData.payment_method && (
          <div className="mb-4 text-xs text-center">
            <span className="font-semibold">Payment Method: </span>
            <span className="uppercase">{receiptData.payment_method}</span>
          </div>
        )}

        
        {/* Footer Info */}
      <div className="mt-8 text-xs">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-semibold">Served By:</span>
            <span className="ml-2">{receiptData.served_by?.name || 'SYSTEM'}</span>
            <p>Record updated successfully in {hospitalInfo?.name || 'the system'}</p>
            <p><span className="font-semibold">Date Time:</span> {new Date(receiptData.created_at || Date.now()).toLocaleString('en-KE')}</p>
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

export default Receipt;
