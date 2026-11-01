import { X, MapPin, Clock, User, Phone, Car, AlertTriangle, CheckCircle, Stethoscope, Printer, Building2, IdCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AmbulanceRequestModal = ({ request, patient, onClose, onUpdate }) => {
  const { user } = useAuth();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      case 'Dispatched': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Parse JSON fields safely
  const vitalSigns = request.vital_signs ? (typeof request.vital_signs === 'string' ? JSON.parse(request.vital_signs) : request.vital_signs) : {};
  const symptoms = request.symptoms ? (typeof request.symptoms === 'string' ? JSON.parse(request.symptoms) : request.symptoms) : [];
  const requiredEquipment = request.required_equipment ? (typeof request.required_equipment === 'string' ? JSON.parse(request.required_equipment) : request.required_equipment) : [];

  // Use patient data if available, otherwise fall back to request data
  const patientData = patient || {
    name: request.patient_name,
    age: request.patient_age,
    gender: request.patient_gender,
    phone: request.patient_phone,
    id_number: request.patient_id_number
  };

  const isExternalRequest = request.requester_type === 'EXTERNAL';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Ambulance Request #AMB-{String(request.id).padStart(4, '0')}
            </h2>
            <p className="text-gray-600">
              {isExternalRequest ? 'External Hospital Request' : 'Internal Patient Transfer'} - {request.request_direction === 'OUTGOING' ? 'Outgoing' : 'Incoming'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Request Type</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isExternalRequest 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {isExternalRequest ? 'External' : 'Internal'}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Direction</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  request.request_direction === 'OUTGOING' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {request.request_direction}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Priority</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
                  {request.priority}
                </span>
              </div>
            </div>
          </div>

          {/* External Hospital Information */}
          {isExternalRequest && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <Building2 size={18} />
                Referring Hospital Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-orange-600 font-medium">Hospital Name</p>
                  <p className="text-orange-800 font-semibold">{request.requesting_hospital_name}</p>
                </div>
                <div>
                  <p className="text-orange-600 font-medium">Location</p>
                  <p className="text-orange-800">{request.requesting_hospital_location}</p>
                </div>
                <div>
                  <p className="text-orange-600 font-medium">Contact Person</p>
                  <p className="text-orange-800">{request.requesting_hospital_contact_person}</p>
                </div>
                <div>
                  <p className="text-orange-600 font-medium">Contact Phone</p>
                  <p className="text-orange-800 flex items-center gap-1">
                    <Phone size={14} />
                    {request.requesting_hospital_contact}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Patient Information - Show for both types but with different emphasis */}
          <div className={`border rounded-lg p-4 ${
            isExternalRequest 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-indigo-50 border-indigo-200'
          }`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
              isExternalRequest ? 'text-blue-800' : 'text-indigo-800'
            }`}>
              <User size={18} />
              {isExternalRequest ? 'Patient Information (External)' : 'Patient Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className={`font-medium ${isExternalRequest ? 'text-blue-600' : 'text-indigo-600'}`}>Name</p>
                <p className={isExternalRequest ? 'text-blue-800' : 'text-indigo-800'}>
                  {patientData.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className={`font-medium ${isExternalRequest ? 'text-blue-600' : 'text-indigo-600'}`}>Age</p>
                <p className={isExternalRequest ? 'text-blue-800' : 'text-indigo-800'}>
                  {patientData.age || 'N/A'}
                </p>
              </div>
              <div>
                <p className={`font-medium ${isExternalRequest ? 'text-blue-600' : 'text-indigo-600'}`}>Gender</p>
                <p className={isExternalRequest ? 'text-blue-800' : 'text-indigo-800'}>
                  {patientData.gender || 'N/A'}
                </p>
              </div>
              <div>
                <p className={`font-medium ${isExternalRequest ? 'text-blue-600' : 'text-indigo-600'}`}>Phone</p>
                <p className={`flex items-center gap-1 ${isExternalRequest ? 'text-blue-800' : 'text-indigo-800'}`}>
                  <Phone size={14} />
                  {patientData.phone || 'N/A'}
                </p>
              </div>
              {patientData.id_number && (
                <div>
                  <p className={`font-medium ${isExternalRequest ? 'text-blue-600' : 'text-indigo-600'}`}>ID Number</p>
                  <p className={`flex items-center gap-1 ${isExternalRequest ? 'text-blue-800' : 'text-indigo-800'}`}>
                    <IdCard size={14} />
                    {patientData.id_number}
                  </p>
                </div>
              )}
              {request.patient_id && (
                <div>
                  <p className={`font-medium ${isExternalRequest ? 'text-blue-600' : 'text-indigo-600'}`}>Patient ID</p>
                  <p className={isExternalRequest ? 'text-blue-800' : 'text-indigo-800'}>
                    PID-{String(request.patient_id).padStart(4, '0')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trip Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pickup Location Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin size={18} />
                {isExternalRequest ? 'Pickup Location' : 'Current Location'}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium text-gray-800">
                    {isExternalRequest ? request.requesting_hospital_name : request.pickup_location}
                  </p>
                  {isExternalRequest ? (
                    <p className="text-xs text-gray-500 mt-1">{request.requesting_hospital_location}</p>
                  ) : (
                    request.pickup_location_details && (
                      <p className="text-xs text-gray-500 mt-1">{request.pickup_location_details}</p>
                    )
                  )}
                </div>
                {isExternalRequest && (
                  <div>
                    <p className="text-sm text-gray-600">Contact at Pickup</p>
                    <p className="font-medium text-gray-800">
                      {request.requesting_hospital_contact_person} - {request.requesting_hospital_contact}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Destination Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin size={18} />
                Destination
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Facility</p>
                  <p className="font-medium text-gray-800">{request.destination}</p>
                  {request.destination_details && (
                    <p className="text-xs text-gray-500 mt-1">{request.destination_details}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Request Type</p>
                  <p className="font-medium text-gray-800 capitalize">{request.request_type?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ambulance Information */}
          {request.ambulance_id && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Car size={18} />
                Ambulance Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ambulance Number</p>
                  <p className="font-medium text-gray-800">{request.ambulance_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-800">{request.ambulance_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="font-medium text-gray-800">{request.driver_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Driver Phone</p>
                  <p className="font-medium text-gray-800 flex items-center gap-1">
                    <Phone size={14} />
                    {request.driver_phone}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Medical Information - Show for both internal and external */}
          {(request.patient_condition || request.emergency_details || symptoms.length > 0 || requiredEquipment.length > 0) && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Stethoscope size={18} />
                Medical Information
              </h3>
              
              {/* Patient Condition */}
              {request.patient_condition && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Patient Condition</p>
                  <p className="text-gray-800 bg-gray-50 rounded p-3">
                    {request.patient_condition}
                  </p>
                </div>
              )}

              {/* Emergency Details */}
              {request.emergency_details && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Emergency Details</p>
                  <p className="text-gray-800 bg-red-50 rounded p-3">
                    {request.emergency_details}
                  </p>
                </div>
              )}

              {/* Vital Signs */}
              {(vitalSigns.bp || vitalSigns.pulse || vitalSigns.temp || vitalSigns.oxygen) && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Vital Signs</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {vitalSigns.bp && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-600">Blood Pressure</p>
                        <p className="font-medium text-gray-800">{vitalSigns.bp}</p>
                      </div>
                    )}
                    {vitalSigns.pulse && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-600">Pulse Rate</p>
                        <p className="font-medium text-gray-800">{vitalSigns.pulse} bpm</p>
                      </div>
                    )}
                    {vitalSigns.temp && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-600">Temperature</p>
                        <p className="font-medium text-gray-800">{vitalSigns.temp}°C</p>
                      </div>
                    )}
                    {vitalSigns.oxygen && (
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-xs text-gray-600">O₂ Saturation</p>
                        <p className="font-medium text-gray-800">{vitalSigns.oxygen}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Symptoms */}
                {symptoms.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Symptoms</p>
                    <div className="flex flex-wrap gap-2">
                      {symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Equipment */}
                {requiredEquipment.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Required Equipment</p>
                    <div className="flex flex-wrap gap-2">
                      {requiredEquipment.map((equipment, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium"
                        >
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Medical Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {request.medical_history && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Medical History</p>
                    <p className="text-gray-800 text-sm">{request.medical_history}</p>
                  </div>
                )}
                {request.current_medications && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Current Medications</p>
                    <p className="text-gray-800 text-sm">{request.current_medications}</p>
                  </div>
                )}
                {request.allergies && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Allergies</p>
                    <p className="text-gray-800 text-sm">{request.allergies}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          {request.special_instructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={18} />
                Special Instructions
              </h3>
              <p className="text-amber-700">{request.special_instructions}</p>
            </div>
          )}

          {/* Doctor Notes */}
          {request.doctor_notes && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle size={18} />
                Doctor's Notes
              </h3>
              <p className="text-green-700">{request.doctor_notes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Request Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Request Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(request.created_at).toLocaleString()} by {request.requested_by_name}
                  </p>
                </div>
              </div>
              
              {request.approval_date && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Doctor Approved</p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.approval_date).toLocaleString()} by {request.approved_by_name}
                    </p>
                  </div>
                </div>
              )}
              
              {request.dispatch_time && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Dispatched</p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.dispatch_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              
              {request.completion_time && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Completed</p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.completion_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {(user.role === 'receptionist' || user.role === 'reception') && 
           request.status === 'Approved' && !request.printed_at && request.request_direction === 'OUTGOING' && (
            <button
              onClick={() => {
                window.open(`/requests/${request.id}/print`, '_blank');
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Printer size={16} />
              Print Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmbulanceRequestModal;