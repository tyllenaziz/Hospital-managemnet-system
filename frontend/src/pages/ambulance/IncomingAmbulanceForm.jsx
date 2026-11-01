import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, User, MapPin, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const IncomingAmbulanceForm = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  
  const [formData, setFormData] = useState({
    // Patient Information
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    patient_phone: '',
    patient_id_number: '', // Add this field
    
    // Ambulance Information
    ambulance_number: '',
    driver_name: '',
    driver_phone: '',
    
    // Location Information
    pickup_location: '',
    pickup_location_details: '',
    
    // Medical Information
    patient_condition: '',
    emergency_details: '',
    vital_signs: {
      bp: '',
      pulse: '',
      temp: '',
      oxygen: ''
    },
    symptoms: [],
    medical_history: '',
    current_medications: '',
    allergies: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const symptomOptions = [
    'Chest Pain', 'Difficulty Breathing', 'Bleeding', 'Unconscious',
    'Fever', 'Headache', 'Nausea', 'Vomiting', 'Dizziness',
    'Abdominal Pain', 'Seizure', 'Trauma', 'Burns'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare the data for submission
      const submissionData = {
        ...formData,
        vital_signs: JSON.stringify(formData.vital_signs),
        symptoms: JSON.stringify(formData.symptoms),
        required_equipment: JSON.stringify([]), // Add empty array for required equipment
        request_direction: 'INCOMING', // Explicitly set direction
        request_type: 'emergency', // Set default request type
        priority: 'Medium' // Set default priority
      };

      const response = await authenticatedFetch(`${API_BASE_URL}/ambulance/requests/incoming`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      
      if (data.success) {
        navigate('/reception/ambulance-requests', { 
          state: { message: 'Incoming ambulance registered successfully!' } 
        });
      } else {
        setError(data.error || 'Failed to register incoming ambulance');
      }
    } catch (error) {
      setError('Failed to submit request. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomChange = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Register Incoming Ambulance</h1>
          <p className="text-gray-600">Record details for patient arriving by ambulance</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Patient Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <User size={18} />
            Patient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Name *
              </label>
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                value={formData.patient_age}
                onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                value={formData.patient_gender}
                onChange={(e) => setFormData({ ...formData, patient_gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.patient_phone}
                onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID Number
              </label>
              <input
                type="text"
                value={formData.patient_id_number}
                onChange={(e) => setFormData({ ...formData, patient_id_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional: Patient hospital ID or national ID"
              />
            </div>
          </div>
        </div>

        {/* Ambulance Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-4">Ambulance Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambulance Number *
              </label>
              <input
                type="text"
                value={formData.ambulance_number}
                onChange={(e) => setFormData({ ...formData, ambulance_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., AMB-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Name *
              </label>
              <input
                type="text"
                value={formData.driver_name}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Driver Phone *
              </label>
              <input
                type="tel"
                value={formData.driver_phone}
                onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
            <MapPin size={18} />
            Pickup Location
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location *
              </label>
              <input
                type="text"
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Main Street, Downtown"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Details
              </label>
              <textarea
                value={formData.pickup_location_details}
                onChange={(e) => setFormData({ ...formData, pickup_location_details: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Detailed address, landmarks, building information..."
              />
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-4">Medical Information</h3>
          
          {/* Vital Signs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">BP</label>
              <input
                type="text"
                value={formData.vital_signs.bp}
                onChange={(e) => setFormData({
                  ...formData,
                  vital_signs: { ...formData.vital_signs, bp: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="120/80"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pulse</label>
              <input
                type="text"
                value={formData.vital_signs.pulse}
                onChange={(e) => setFormData({
                  ...formData,
                  vital_signs: { ...formData.vital_signs, pulse: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Temp (°C)</label>
              <input
                type="text"
                value={formData.vital_signs.temp}
                onChange={(e) => setFormData({
                  ...formData,
                  vital_signs: { ...formData.vital_signs, temp: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="36.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">O₂ Sat</label>
              <input
                type="text"
                value={formData.vital_signs.oxygen}
                onChange={(e) => setFormData({
                  ...formData,
                  vital_signs: { ...formData.vital_signs, oxygen: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="98%"
              />
            </div>
          </div>

          {/* Symptoms */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {symptomOptions.map((symptom) => (
                <label key={symptom} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom)}
                    onChange={() => handleSymptomChange(symptom)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Medical Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient Condition *
              </label>
              <textarea
                value={formData.patient_condition}
                onChange={(e) => setFormData({ ...formData, patient_condition: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Describe the patient's current condition..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Details
              </label>
              <textarea
                value={formData.emergency_details}
                onChange={(e) => setFormData({ ...formData, emergency_details: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Details about the emergency situation..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical History
              </label>
              <textarea
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Any relevant medical history..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Medications
              </label>
              <textarea
                value={formData.current_medications}
                onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Current medications the patient is taking..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Any known allergies..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            {loading ? 'Registering...' : 'Register Incoming Ambulance'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IncomingAmbulanceForm;