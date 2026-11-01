import { Activity, Heart, Thermometer, Wind, Weight, Ruler, Droplet, RefreshCw, Edit, Save } from 'lucide-react';
import { formatDisplayNumber } from '../../../utils/numberFormat';

const VitalsSection = ({
    vitals,
    vitalsData,
    setVitalsData,
    showVitalsForm,
    setShowVitalsForm,
    savingVitals,
    onSaveVitals,
    onRefreshVitals
}) => {

    const getBPStatus = () => {
        if (!vitals?.blood_pressure_systolic || !vitals?.blood_pressure_diastolic) return null;
        const sys = parseFloat(vitals.blood_pressure_systolic);
        const dia = parseFloat(vitals.blood_pressure_diastolic);
        if (sys >= 140 || dia >= 90) return 'High';
        if (sys < 90 || dia < 60) return 'Low';
        return 'Normal';
    };

    const getBMIStatus = () => {
        if (!vitals?.bmi) return null;
        const bmi = parseFloat(vitals.bmi);
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    };

    const VitalCard = ({ icon: Icon, label, value, unit, status, color = "text-gray-900" }) => (
        <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon size={18} className="text-teal-600" />
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                </div>
                {status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${status === 'Normal' ? 'bg-green-100 text-green-800' :
                            status === 'High' ? 'bg-red-100 text-red-800' :
                                status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                        }`}>
                        {status}
                    </span>
                )}
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold ${color}`}>
                    {value !== null && value !== undefined && value !== '' ? value : '--'}
                </span>
                {unit && <span className="text-xs text-gray-500">{unit}</span>}
            </div>
        </div>
    );

    // Display vitals when available
    if (vitals && !showVitalsForm) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl shadow-md p-6">
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
                            onClick={onRefreshVitals}
                            className="p-2 hover:bg-white rounded-lg transition"
                            title="Refresh vitals"
                        >
                            <RefreshCw size={20} className="text-gray-600" />
                        </button>
                        <button
                            onClick={() => setShowVitalsForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-teal-600 rounded-lg hover:bg-teal-50 transition text-sm font-medium"
                        >
                            <Edit size={16} />
                            Update Vitals
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <VitalCard
                        icon={Heart}
                        label="Blood Pressure"
                        value={vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic
                            ? `${formatDisplayNumber(vitals.blood_pressure_systolic)}/${formatDisplayNumber(vitals.blood_pressure_diastolic)}`
                            : null}
                        unit="mmHg"
                        status={getBPStatus()}
                    />
                    <VitalCard icon={Activity} label="Pulse Rate" value={vitals.pulse_rate} unit="bpm" />
                    <VitalCard
                        icon={Thermometer}
                        label="Temperature"
                        value={formatDisplayNumber(vitals.temperature)}
                        unit="°C"
                        color={vitals.temperature && parseFloat(vitals.temperature) > 37.5 ? 'text-red-600' : 'text-gray-900'}
                    />
                    <VitalCard icon={Wind} label="Respiratory Rate" value={vitals.respiratory_rate} unit="/min" />
                    <VitalCard icon={Weight} label="Weight" value={formatDisplayNumber(vitals.weight)} unit="kg" />
                    <VitalCard icon={Ruler} label="Height" value={formatDisplayNumber(vitals.height)} unit="cm" />
                    <VitalCard icon={Activity} label="BMI" value={formatDisplayNumber(vitals.bmi)} status={getBMIStatus()} />
                    <VitalCard icon={Droplet} label="Blood Sugar" value={formatDisplayNumber(vitals.blood_sugar)} unit="mg/dL" />
                    <VitalCard
                        icon={Activity}
                        label="SpO2"
                        value={vitals.oxygen_saturation}
                        unit="%"
                        color={vitals.oxygen_saturation && parseFloat(vitals.oxygen_saturation) < 95 ? 'text-red-600' : 'text-gray-900'}
                    />
                </div>

                {vitals.notes && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Additional Notes:</p>
                        <p className="text-gray-900">{vitals.notes}</p>
                    </div>
                )}
            </div>
        );
    }

    // No vitals recorded state
    if (!vitals && !showVitalsForm) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="text-yellow-600" size={24} />
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">No Vitals Recorded</h3>
                            <p className="text-gray-700 text-sm">Patient vitals have not been recorded yet.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowVitalsForm(true)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                    >
                        Record Vitals
                    </button>
                </div>
            </div>
        );
    }

    // Vitals form
    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                    {vitals ? 'Update Vitals' : 'Record Vitals'}
                </h3>
                <button
                    onClick={() => setShowVitalsForm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                    Cancel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BP Systolic (mmHg)</label>
                    <input
                        type="number"
                        value={vitalsData.blood_pressure_systolic}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, blood_pressure_systolic: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="120"
                        step="0.01"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BP Diastolic (mmHg)</label>
                    <input
                        type="number"
                        value={vitalsData.blood_pressure_diastolic}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, blood_pressure_diastolic: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="80"
                        step="0.01"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperature (°C)</label>
                    <input
                        type="number"
                        value={vitalsData.temperature}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, temperature: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="37.0"
                        step="0.1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pulse Rate (bpm)</label>
                    <input
                        type="number"
                        value={vitalsData.pulse_rate}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, pulse_rate: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="72"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Respiratory Rate (/min)</label>
                    <input
                        type="number"
                        value={vitalsData.respiratory_rate}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, respiratory_rate: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="16"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                    <input
                        type="number"
                        value={vitalsData.weight}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="70"
                        step="0.1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                    <input
                        type="number"
                        value={vitalsData.height}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, height: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="170"
                        step="0.1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">BMI (Auto)</label>
                    <input
                        type="text"
                        value={vitalsData.bmi}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                        placeholder="--"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Sugar (mg/dL)</label>
                    <input
                        type="number"
                        value={vitalsData.blood_sugar}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, blood_sugar: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="100"
                        step="0.1"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SpO2 (%)</label>
                    <input
                        type="number"
                        value={vitalsData.oxygen_saturation}
                        onChange={(e) => setVitalsData(prev => ({ ...prev, oxygen_saturation: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        placeholder="98"
                        min="0"
                        max="100"
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                    value={vitalsData.notes}
                    onChange={(e) => setVitalsData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Any additional observations..."
                />
            </div>

            <div className="flex gap-3 justify-end">
                <button
                    onClick={() => setShowVitalsForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={onSaveVitals}
                    disabled={savingVitals}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                    <Save size={18} />
                    {savingVitals ? 'Saving...' : 'Save Vitals'}
                </button>
            </div>
        </div>
    );
};

export default VitalsSection;
