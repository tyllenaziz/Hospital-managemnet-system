import { ArrowLeft, Save, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ConsultationHeader = ({
    currentPatient,
    isReopened,
    saving,
    onSave,
    onAmbulanceRequest
}) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/doctor/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {isReopened ? 'Edit Consultation' : 'Consultation'} - {currentPatient?.name}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            {currentPatient?.age} yrs • {currentPatient?.gender} •
                            ID: {currentPatient?.id_number} •
                            Queue: {currentPatient?.queue_number}
                        </p>
                    </div>
                    <button
                        onClick={onAmbulanceRequest}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition"
                    >
                        <Car size={18} />
                        Request Ambulance
                    </button>
                </div>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-sm transition"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>{isReopened ? 'Update Consultation' : 'Complete Consultation'}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ConsultationHeader;
