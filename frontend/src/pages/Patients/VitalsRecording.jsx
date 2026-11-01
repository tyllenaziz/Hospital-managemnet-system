import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, Heart, Thermometer, Wind, Weight, Ruler, Droplet, ArrowLeft, Save, AlertCircle, Pill } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { normalizeNumericInputValue } from '../../utils/numberFormat';

export default function VitalsRecording() {
  const { queueId } = useParams();
  const { authenticatedFetch, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patient, setPatient] = useState(null);
  const [existingVitals, setExistingVitals] = useState(null);

  const [vitals, setVitals] = useState({
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    pulse_rate: '',
    respiratory_rate: '',
    weight: '',
    height: '',
    blood_sugar: '',
    oxygen_saturation: '',
    bmi: '',
    notes: '',
    drug_allergies: ''
  });

  useEffect(() => {
    fetchPatientDetails();
    fetchExistingVitals();
  }, [queueId]);

  useEffect(() => {
    // Auto-calculate BMI when weight and height change
    if (vitals.weight && vitals.height) {
      const heightInMeters = parseFloat(vitals.height) / 100;
      const bmi = (parseFloat(vitals.weight) / (heightInMeters * heightInMeters)).toFixed(2);
      if (!isNaN(bmi) && isFinite(bmi)) {
        setVitals(prev => ({ ...prev, bmi }));
      }
    }
  }, [vitals.weight, vitals.height]);

  const fetchPatientDetails = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/queue/item/${queueId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatient(data.queue);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  };

  const fetchExistingVitals = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/queue/${queueId}/vitals`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.vitals) {
          setExistingVitals(data.vitals);
          setVitals({
            blood_pressure_systolic: normalizeNumericInputValue(data.vitals.blood_pressure_systolic),
            blood_pressure_diastolic: normalizeNumericInputValue(data.vitals.blood_pressure_diastolic),
            temperature: normalizeNumericInputValue(data.vitals.temperature),
            pulse_rate: data.vitals.pulse_rate || '',
            respiratory_rate: data.vitals.respiratory_rate || '',
            weight: normalizeNumericInputValue(data.vitals.weight),
            height: normalizeNumericInputValue(data.vitals.height),
            blood_sugar: normalizeNumericInputValue(data.vitals.blood_sugar),
            oxygen_saturation: data.vitals.oxygen_saturation || '',
            bmi: normalizeNumericInputValue(data.vitals.bmi),
            notes: data.vitals.notes || '',
            drug_allergies: data.vitals.drug_allergies || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVitals(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/queue/${queueId}/vitals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(vitals)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Vitals recorded successfully!');
        setTimeout(() => {
          navigate('/nurse/dashboard');
        }, 2000);
      } else {
        setError(data.error || 'Failed to record vitals');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error recording vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBPStatus = () => {
    const sys = parseFloat(vitals.blood_pressure_systolic);
    const dia = parseFloat(vitals.blood_pressure_diastolic);
    if (!sys || !dia) return '';
    
    if (sys >= 140 || dia >= 90) return 'High';
    if (sys < 90 || dia < 60) return 'Low';
    return 'Normal';
  };

  const getBMICategory = () => {
    const bmi = parseFloat(vitals.bmi);
    if (!bmi) return '';
    
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/nurse/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Record Vitals</h1>
            {patient && (
              <p className="text-gray-600 mt-1">
                Patient: <span className="font-semibold">{patient.name}</span> | 
                Queue: <span className="font-semibold">{patient.queue_number}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cardiovascular Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="text-red-500" size={24} />
            Cardiovascular
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Pressure (Systolic)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="blood_pressure_systolic"
                  value={vitals.blood_pressure_systolic}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="120"
                  step="0.01"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">mmHg</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Pressure (Diastolic)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="blood_pressure_diastolic"
                  value={vitals.blood_pressure_diastolic}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="80"
                  step="0.01"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">mmHg</span>
              </div>
            </div>
            {getBPStatus() && (
              <div className="flex items-center">
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  getBPStatus() === 'Normal' ? 'bg-green-100 text-green-800' :
                  getBPStatus() === 'High' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  BP: {getBPStatus()}
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Activity className="inline mr-2" size={16} />
                Pulse Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="pulse_rate"
                  value={vitals.pulse_rate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="72"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">bpm</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Wind className="inline mr-2" size={16} />
                Respiratory Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="respiratory_rate"
                  value={vitals.respiratory_rate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="16"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">/min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Physical Measurements Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Ruler className="text-blue-500" size={24} />
            Physical Measurements
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Weight className="inline mr-2" size={16} />
                Weight
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="weight"
                  value={vitals.weight}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="70"
                  step="0.1"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">kg</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Ruler className="inline mr-2" size={16} />
                Height
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="height"
                  value={vitals.height}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="170"
                  step="0.1"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">cm</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                BMI (Auto-calculated)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vitals.bmi}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  placeholder="--"
                />
                {getBMICategory() && (
                  <span className={`absolute right-3 top-2.5 text-xs font-semibold ${
                    getBMICategory() === 'Normal' ? 'text-green-600' :
                    getBMICategory() === 'Underweight' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {getBMICategory()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Measurements Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Thermometer className="text-orange-500" size={24} />
            Clinical Measurements
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="temperature"
                  value={vitals.temperature}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="37.0"
                  step="0.1"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">°C</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Droplet className="inline mr-2" size={16} />
                Blood Sugar
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="blood_sugar"
                  value={vitals.blood_sugar}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="100"
                  step="0.1"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">mg/dL</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oxygen Saturation (SpO2)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="oxygen_saturation"
                  value={vitals.oxygen_saturation}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="98"
                  min="0"
                  max="100"
                />
                <span className="absolute right-3 top-2.5 text-gray-500 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Pill className="text-purple-500" size={24} />
            Medical History
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drug Allergies & Reactions
              </label>
              <textarea
                name="drug_allergies"
                value={vitals.drug_allergies}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="List any drug allergies and reactions (e.g., Penicillin - rash, Ibuprofen - stomach pain, Aspirin - breathing difficulty)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Please specify the drug name and the reaction it causes
              </p>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={vitals.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            placeholder="Any additional observations or notes..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/nurse/dashboard')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={20} />
            {loading ? 'Saving...' : existingVitals ? 'Update Vitals' : 'Save & Send to Doctor'}
          </button>
        </div>
      </form>
    </div>
  );
}
