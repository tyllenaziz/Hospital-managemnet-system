import { useState, useEffect } from 'react';
import { Activity, Heart, Thermometer, Wind, Weight, Ruler, Droplet, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VitalsDisplay = ({ queueId, userRole }) => {
  const [vitals, setVitals] = useState(null);
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    fetchVitals();
  }, [queueId]);

  const fetchVitals = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/queue/${queueId}/vitals`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVitals(data.vitals);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const VitalCard = ({ icon: Icon, label, value, unit, status, color = "text-gray-900" }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-teal-600" />
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        {status && (
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            status === 'Normal' ? 'bg-green-100 text-green-800' :
            status === 'High' ? 'bg-red-100 text-red-800' :
            status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${color}`}>
          {value || '--'}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  if (!vitals) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="text-yellow-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">No Vitals Recorded</h3>
        </div>
        <p className="text-gray-700 mb-4">
          Patient vitals have not been recorded yet. {userRole === 'doctor' && 'You can record them now or continue with the consultation.'}
        </p>
        {userRole === 'doctor' && (
          <button
            onClick={() => setShowEditForm(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Record Vitals
          </button>
        )}
      </div>
    );
  }

  const getBPStatus = () => {
    if (!vitals.blood_pressure_systolic || !vitals.blood_pressure_diastolic) return null;
    const sys = parseFloat(vitals.blood_pressure_systolic);
    const dia = parseFloat(vitals.blood_pressure_diastolic);
    if (sys >= 140 || dia >= 90) return 'High';
    if (sys < 90 || dia < 60) return 'Low';
    return 'Normal';
  };

  const getBMIStatus = () => {
    if (!vitals.bmi) return null;
    const bmi = parseFloat(vitals.bmi);
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="text-teal-600" size={28} />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Patient Vitals</h3>
            <p className="text-sm text-gray-600">
              Recorded by {vitals.recorded_by_name} ({vitals.recorded_by_role}) • {new Date(vitals.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchVitals}
            className="p-2 hover:bg-white rounded-lg transition"
            title="Refresh vitals"
          >
            <RefreshCw size={20} className="text-gray-600" />
          </button>
          {userRole === 'doctor' && (
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition text-sm font-medium"
            >
              {showEditForm ? 'Cancel' : 'Update Vitals'}
            </button>
          )}
        </div>
      </div>

      {!showEditForm && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <VitalCard
            icon={Heart}
            label="Blood Pressure"
            value={vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic 
              ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`
              : null}
            unit="mmHg"
            status={getBPStatus()}
          />
          
          <VitalCard
            icon={Activity}
            label="Pulse Rate"
            value={vitals.pulse_rate}
            unit="bpm"
          />
          
          <VitalCard
            icon={Thermometer}
            label="Temperature"
            value={vitals.temperature}
            unit="°C"
            color={vitals.temperature && parseFloat(vitals.temperature) > 37.5 ? 'text-red-600' : 'text-gray-900'}
          />
          
          <VitalCard
            icon={Wind}
            label="Respiratory Rate"
            value={vitals.respiratory_rate}
            unit="/min"
          />
          
          <VitalCard
            icon={Weight}
            label="Weight"
            value={vitals.weight}
            unit="kg"
          />
          
          <VitalCard
            icon={Ruler}
            label="Height"
            value={vitals.height}
            unit="cm"
          />
          
          <VitalCard
            icon={Activity}
            label="BMI"
            value={vitals.bmi}
            status={getBMIStatus()}
          />
          
          <VitalCard
            icon={Droplet}
            label="Blood Sugar"
            value={vitals.blood_sugar}
            unit="mg/dL"
          />
          
          <VitalCard
            icon={Activity}
            label="Oxygen Saturation"
            value={vitals.oxygen_saturation}
            unit="%"
            color={vitals.oxygen_saturation && parseFloat(vitals.oxygen_saturation) < 95 ? 'text-red-600' : 'text-gray-900'}
          />
        </div>
      )}

      {vitals.notes && !showEditForm && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes:</p>
          <p className="text-gray-900">{vitals.notes}</p>
        </div>
      )}

      {showEditForm && (
        <div className="mt-4 p-6 bg-white rounded-lg border border-gray-200">
          <p className="text-center text-gray-600">
            Vitals update form would go here - integrate with your VitalsRecording component
          </p>
        </div>
      )}
    </div>
  );
};

export default VitalsDisplay;