import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';

const SystemSettings = () => {
  const { user, authenticatedFetch } = useAuth();
  const [consultationFee, setConsultationFee] = useState('500');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/settings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConsultationFee(data.settings.consultation_fee.toString());
      } else {
        throw new Error(data.error || 'Failed to load settings');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    const fee = parseFloat(consultationFee);
    if (isNaN(fee) || fee < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setSaving(true);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ consultation_fee: fee })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Settings updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-gray-600 mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">System Settings</h1>
            <p className="text-slate-600">Configure hospital fees and charges</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-100 rounded-xl">
                <Settings size={24} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Fee Configuration</h2>
                <p className="text-sm text-slate-600">Manage hospital charges</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <DollarSign className="text-teal-600" size={24} />
                </div>
                <div className="flex-1">
                  <label className="block text-slate-800 font-semibold mb-2 text-lg">
                    Consultation Fee
                  </label>
                  <p className="text-slate-600 text-sm mb-4">
                    Default fee charged for doctor consultation per visit
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-700 font-medium">KES</span>
                    <input
                      type="number"
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      min="0"
                      step="50"
                      className="w-40 px-4 py-3 border-2 border-blue-300 rounded-lg text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                      disabled={saving}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Current value: KES {parseFloat(consultationFee).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Important Information
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                <li>This fee will be automatically added to all new patient bills</li>
                <li>Changes apply to new bills only, not existing ones</li>
                <li>The fee can be adjusted per patient during billing if needed</li>
              </ul>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-all"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default SystemSettings;