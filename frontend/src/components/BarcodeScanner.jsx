// ============================================
// BarcodeScanner.jsx - Updated with useSymbologyScanner
// ============================================
import React, { useState, useRef } from 'react';
import { X, Barcode, CheckCircle, Scan, Keyboard } from 'lucide-react';
import { useSymbologyScanner } from '@use-symbology-scanner/react';

const BarcodeScanner = ({ onScan, onClose, isOpen }) => {
  const scannerRef = useRef(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [scannerActive, setScannerActive] = useState(false);
  const [detectedBarcode, setDetectedBarcode] = useState(null);
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');

  // Barcode scanner handler
  const handleSymbol = (symbol, matchedSymbologies) => {
    console.log(`Scanned barcode: ${symbol}`, matchedSymbologies);
    
    // Prevent duplicate scans
    if (symbol === lastScannedBarcode) return;
    setLastScannedBarcode(symbol);
    setDetectedBarcode(symbol);
    setScannerActive(true);
    
    // Auto-submit after showing detection
    setTimeout(() => {
      onScan(symbol);
      resetScanner();
    }, 1000);
  };

  // Initialize barcode scanner
  useSymbologyScanner(handleSymbol, { 
    target: scannerRef,
    enabled: scannerEnabled && isOpen
  });

  const resetScanner = () => {
    setDetectedBarcode(null);
    setBarcodeInput('');
    setScannerActive(false);
    setLastScannedBarcode('');
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      onScan(barcodeInput.trim());
      resetScanner();
    }
  };

  const handleClose = () => {
    resetScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div ref={scannerRef} className="bg-white rounded-lg border border-gray-200 w-full max-w-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Barcode className="text-teal-600" size={20} />
              <h3 className="text-lg font-bold text-gray-900">Scan Barcode</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Scanner Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Scanner Status</span>
              <button
                onClick={() => setScannerEnabled(!scannerEnabled)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  scannerEnabled 
                    ? 'bg-green-100 text-green-700 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {scannerEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {scannerEnabled && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                {scannerActive || detectedBarcode ? (
                  <>
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="font-medium text-green-700">Barcode Detected!</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    <span>Ready to scan - Use your barcode scanner</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Success Message */}
          {detectedBarcode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Barcode Detected!</p>
                  <p className="text-sm font-mono text-green-700">{detectedBarcode}</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Entry Form */}
          <div className="border-t border-gray-200 pt-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or Enter Barcode Manually
                </label>
                <div className="relative">
                  <Keyboard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Type barcode number..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!barcodeInput.trim()}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Use Barcode
                </button>
              </div>
            </form>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-700 font-medium mb-2">Instructions:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Turn scanner ON and scan with your barcode device</li>
              <li>• Or type the barcode manually in the field above</li>
              <li>• Supports EAN-13, UPC, Code 128, and more</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;