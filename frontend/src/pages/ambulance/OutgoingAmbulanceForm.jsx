import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, User, MapPin, AlertTriangle, Stethoscope, Phone, Calendar, FileText, IdCard, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const OutgoingAmbulanceForm = () => {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  
  // Get patient data from navigation state
  const patientFromNav = location.state?.patient;
  
  const [formData, setFormData] = useState({
    patient_id: '',
    request_type: 'Referral',
    requester_type: 'INTERNAL', // INTERNAL (doctor) or EXTERNAL (hospital)
    priority: 'Medium',
    pickup_location: 'Hospital Main Entrance',
    pickup_location_details: '',
    destination: '',
    destination_details: '',
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    patient_phone: '',
    patient_id_number: '',
    patient_condition: '',
    emergency_details: '',
    vital_signs: {
      bp: '',
      pulse: '',
      temp: '',
      oxygen: '',
      respiratory_rate: '',
      blood_sugar: ''
    },
    symptoms: [],
    medical_history: '',
    current_medications: '',
    allergies: '',
    required_equipment: [],
    special_instructions: '',
    // External hospital fields
    requesting_hospital_name: '',
    requesting_hospital_location: '',
    requesting_hospital_contact: '',
    requesting_hospital_contact_person: ''
  });
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ambulances, setAmbulances] = useState([]);
  const [patientLoading, setPatientLoading] = useState(!!queueId && !patientFromNav);

  const equipmentOptions = [
    'Oxygen Cylinder',
    'Defibrillator',
    'Ventilator',
    'Stretcher',
    'First Aid Kit',
    'IV Supplies',
    'Monitor',
    'Suction Device',
    'Spinal Board',
    'Neck Collar',
    'Portable Oxygen',
    'Emergency Medications',
    'Trauma Kit',
    'Childbirth Kit'
  ];

  useEffect(() => {
    // If patient data came from navigation (e.g., from consultation)
    if (patientFromNav) {
      setPatient(patientFromNav);
      setFormData(prev => ({
        ...prev,
        patient_id: patientFromNav.patient_id || patientFromNav.id,
        patient_name: patientFromNav.name || '',
        patient_age: patientFromNav.age || '',
        patient_gender: patientFromNav.gender || '',
        patient_phone: patientFromNav.phone || '',
        patient_id_number: patientFromNav.id_number || '',
        medical_history: patientFromNav.notes || patientFromNav.medical_history || ''
      }));
    } else if (queueId) {
      fetchPatientData();
    }
    fetchAvailableAmbulances();
  }, [queueId, patientFromNav]);

  const fetchPatientData = async () => {
    try {
      setPatientLoading(true);
      setError('');

      // Fetch queue data
      const queueResponse = await authenticatedFetch(`${API_BASE_URL}/queue/${queueId}`);
      const queueData = await queueResponse.json();
      
      console.log('Queue Response:', queueData);
      
      if (!queueData.success || !queueData.data) {
        throw new Error('Failed to load queue data');
      }

      const queue = queueData.data;
      const patientId = queue.patient_id;

      if (!patientId) {
        throw new Error('Patient ID not found in queue data');
      }

      // Fetch full patient details
      const patientResponse = await authenticatedFetch(`${API_BASE_URL}/patients/${patientId}`);
      const patientData = await patientResponse.json();
      
      console.log('Patient Response:', patientData);

      if (!patientData.success || !patientData.data) {
        throw new Error('Failed to load patient data');
      }

      const patientInfo = patientData.data;
      setPatient(patientInfo);

      // Update form with patient data
      setFormData(prev => ({
        ...prev,
        patient_id: patientId,
        patient_name: patientInfo.name || '',
        patient_age: patientInfo.age || '',
        patient_gender: patientInfo.gender || '',
        patient_phone: patientInfo.phone || '',
        patient_id_number: patientInfo.id_number || '',
        medical_history: queue.notes || patientInfo.medical_history || ''
      }));

    } catch (err) {
      console.error('Error fetching patient:', err);
      setError(err.message || 'Failed to load patient data');
    } finally {
      setPatientLoading(false);
    }
  };

  const fetchAvailableAmbulances = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/ambulance/available`);
      const data = await response.json();
      if (data.success) {
        setAmbulances(data.data);
      }
    } catch (error) {
      console.error('Error fetching ambulances:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate based on requester type
    if (formData.requester_type === 'EXTERNAL') {
      // External hospital request validation
      if (!formData.requesting_hospital_name || !formData.requesting_hospital_location || 
          !formData.requesting_hospital_contact || !formData.requesting_hospital_contact_person) {
        setError('Please fill in all hospital details for external requests');
        setLoading(false);
        return;
      }
    } else {
      // Internal request validation
      if (!formData.patient_name || !formData.patient_age || !formData.patient_gender || !formData.patient_phone) {
        setError('Please fill in all required patient details');
        setLoading(false);
        return;
      }
    }

    if (!formData.destination) {
      setError('Destination hospital/facility is required');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        patient_id: formData.patient_id || null,
        requested_by: user?.id,
        request_direction: 'OUTGOING',
        requester_type: formData.requester_type,
        request_type: formData.request_type,
        priority: formData.priority,
        pickup_location: formData.pickup_location,
        pickup_location_details: formData.pickup_location_details,
        destination: formData.destination,
        destination_details: formData.destination_details,
        patient_name: formData.patient_name,
        patient_age: formData.patient_age,
        patient_gender: formData.patient_gender,
        patient_phone: formData.patient_phone,
        patient_id_number: formData.patient_id_number,
        patient_condition: formData.patient_condition,
        emergency_details: formData.emergency_details,
        vital_signs: formData.vital_signs,
        symptoms: formData.symptoms,
        medical_history: formData.medical_history,
        current_medications: formData.current_medications,
        allergies: formData.allergies,
        required_equipment: formData.required_equipment,
        special_instructions: formData.special_instructions,
        // External hospital fields
        requesting_hospital_name: formData.requester_type === 'EXTERNAL' ? formData.requesting_hospital_name : null,
        requesting_hospital_location: formData.requester_type === 'EXTERNAL' ? formData.requesting_hospital_location : null,
        requesting_hospital_contact: formData.requester_type === 'EXTERNAL' ? formData.requesting_hospital_contact : null,
        requesting_hospital_contact_person: formData.requester_type === 'EXTERNAL' ? formData.requesting_hospital_contact_person : null
      };

      console.log('Submitting ambulance request:', submitData);

      const response = await authenticatedFetch(`${API_BASE_URL}/ambulance/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();
      console.log('Server response:', data);
      
      if (data.success) {
        const role = user?.role === 'receptionist' ? 'reception' : user?.role;
        navigate(`/${role}/ambulance-requests`, { 
          state: { message: 'Ambulance request submitted successfully!' } 
        });
      } else {
        setError(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentChange = (equipment) => {
    setFormData(prev => ({
      ...prev,
      required_equipment: prev.required_equipment.includes(equipment)
        ? prev.required_equipment.filter(e => e !== equipment)
        : [...prev.required_equipment, equipment]
    }));
  };

  const handlePatientDetailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show loading state while patient data is being fetched
  if (patientLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Request Ambulance Transfer</h1>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Request Ambulance Transfer</h1>
          <p className="text-gray-600">
            {queueId ? 'Arrange ambulance service for patient transfer' : 'Request ambulance for external emergency or incoming patient'}
          </p>
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

      {/* Patient Information - Only show if patient exists */}
      {patient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <User size={20} />
            Patient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-blue-600 font-medium text-sm">Full Name</p>
                <p className="text-blue-800 font-semibold text-lg">{patient.name}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium text-sm">Age</p>
                <p className="text-blue-800 flex items-center gap-1">
                  <Calendar size={14} />
                  {patient.age} years
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-blue-600 font-medium text-sm">Gender</p>
                <p className="text-blue-800">{patient.gender}</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium text-sm">Phone Number</p>
                <p className="text-blue-800 flex items-center gap-1">
                  <Phone size={14} />
                  {patient.phone}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-blue-600 font-medium text-sm">Patient ID</p>
                <p className="text-blue-800 font-mono flex items-center gap-1">
                  <IdCard size={14} />
                  PID-{String(patient.id).padStart(4, '0')}
                </p>
              </div>
              <div>
                <p className="text-blue-600 font-medium text-sm">ID Number</p>
                <p className="text-blue-800">{patient.id_number || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Requester Type Selection */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2">
            <Building2 size={20} />
            Request Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Who is requesting this ambulance? *
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-indigo-50 cursor-pointer">
                  <input
                    type="radio"
                    name="requester_type"
                    value="INTERNAL"
                    checked={formData.requester_type === 'INTERNAL'}
                    onChange={(e) => setFormData({ ...formData, requester_type: e.target.value })}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Internal Transfer</span>
                    <p className="text-sm text-gray-500">Doctor-initiated transfer for existing patient</p>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-indigo-50 cursor-pointer">
                  <input
                    type="radio"
                    name="requester_type"
                    value="EXTERNAL"
                    checked={formData.requester_type === 'EXTERNAL'}
                    onChange={(e) => setFormData({ ...formData, requester_type: e.target.value })}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">External Hospital Request</span>
                    <p className="text-sm text-gray-500">Request from another hospital for patient pickup</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">
                {formData.requester_type === 'INTERNAL' ? 'Internal Transfer' : 'External Request'}
              </h4>
              <p className="text-sm text-gray-600">
                {formData.requester_type === 'INTERNAL' 
                  ? 'Transferring an existing patient to another facility. Patient details are pre-filled from records.'
                  : 'Picking up a patient from another hospital. Please provide referring hospital details.'}
              </p>
            </div>
          </div>
        </div>

        {/* External Hospital Details - Only show for external requests */}
        {formData.requester_type === 'EXTERNAL' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Referring Hospital Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  value={formData.requesting_hospital_name}
                  onChange={(e) => setFormData({ ...formData, requesting_hospital_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter hospital name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Location *
                </label>
                <input
                  type="text"
                  value={formData.requesting_hospital_location}
                  onChange={(e) => setFormData({ ...formData, requesting_hospital_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter hospital address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={formData.requesting_hospital_contact_person}
                  onChange={(e) => setFormData({ ...formData, requesting_hospital_contact_person: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Name of contact person"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={formData.requesting_hospital_contact}
                  onChange={(e) => setFormData({ ...formData, requesting_hospital_contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Hospital contact number"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Patient Details Section - Only show for internal requests */}
        {formData.requester_type === 'INTERNAL' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="font-semibold text-indigo-800 mb-4 flex items-center gap-2">
              <User size={20} />
              Patient Details for Transfer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => handlePatientDetailChange('patient_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  onChange={(e) => handlePatientDetailChange('patient_age', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.patient_gender}
                  onChange={(e) => handlePatientDetailChange('patient_gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.patient_phone}
                  onChange={(e) => handlePatientDetailChange('patient_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  value={formData.patient_id_number}
                  onChange={(e) => handlePatientDetailChange('patient_id_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="National ID or identification number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Transfer Details - Only show for internal requests */}
        {formData.requester_type === 'INTERNAL' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Transfer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type *
                </label>
                <select
                  value={formData.request_type}
                  onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="Referral">Referral to Another Hospital</option>
                  <option value="Transfer">Patient Transfer</option>
                  <option value="Emergency">Emergency Evacuation</option>
                  <option value="Pharmacy Pickup">Pharmacy/Medical Supply Pickup</option>
                  <option value="Discharge">Patient Discharge</option>
                  <option value="Specialist">Specialist Consultation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="Low">Low (Routine)</option>
                  <option value="Medium">Medium (Urgent)</option>
                  <option value="High">High (Emergency)</option>
                  <option value="Critical">Critical (Life-threatening)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location *
                </label>
                <select
                  value={formData.pickup_location}
                  onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="Hospital Main Entrance">Hospital Main Entrance</option>
                  <option value="Emergency Department">Emergency Department</option>
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="Ward">Patient Ward</option>
                  <option value="Operating Theater">Operating Theater</option>
                  <option value="Other">Other Location</option>
                </select>
              </div>
            </div>

            {formData.pickup_location === 'Other' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specify Pickup Location
                </label>
                <input
                  type="text"
                  value={formData.pickup_location_details}
                  onChange={(e) => setFormData({ ...formData, pickup_location_details: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter specific pickup location details..."
                />
              </div>
            )}
          </div>
        )}

        {/* Location Information - Show for both types but with different content */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Location Information
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-purple-700">
                {formData.requester_type === 'EXTERNAL' ? 'Pickup Location (External Hospital)' : 'Current Location'}
              </h4>
              {formData.requester_type === 'EXTERNAL' ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hospital</p>
                    <p className="text-purple-800 font-semibold">{formData.requesting_hospital_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-purple-800">{formData.requesting_hospital_location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact</p>
                    <p className="text-purple-800">{formData.requesting_hospital_contact_person} - {formData.requesting_hospital_contact}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Patient is currently at: <span className="font-semibold text-purple-800">{formData.pickup_location}</span>
                  </p>
                  {formData.pickup_location_details && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Location Details</p>
                      <p className="text-purple-800">{formData.pickup_location_details}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-purple-700">Destination</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Hospital/Facility *
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter destination hospital or facility name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Details
                </label>
                <textarea
                  value={formData.destination_details}
                  onChange={(e) => setFormData({ ...formData, destination_details: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Specific department, ward, contact person, or special instructions for destination..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Required Equipment & Special Instructions - Show for both types */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-800 mb-4">Required Equipment & Special Instructions</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-amber-700 mb-3">Medical Equipment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equipmentOptions.map((equipment) => (
                  <label key={equipment} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.required_equipment.includes(equipment)}
                      onChange={() => handleEquipmentChange(equipment)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">{equipment}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-amber-700 mb-3">Special Instructions</h4>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Any special instructions for ambulance crew, monitoring requirements, isolation precautions, or specific care protocols..."
              />
            </div>
          </div>
        </div>

        {/* Available Ambulances */}
        {ambulances.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-4">Available Ambulances</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ambulances.map((ambulance) => (
                <div key={ambulance.id} className="bg-white rounded-lg p-4 border border-blue-200 hover:border-blue-400 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-blue-800 text-lg">{ambulance.ambulance_number}</p>
                      <p className="text-sm text-blue-600">{ambulance.type}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                      Available
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Driver: {ambulance.driver_name}</p>
                    <p>Phone: {ambulance.driver_phone}</p>
                    <p>Capacity: {ambulance.capacity} patients</p>
                    {ambulance.equipment && (
                      <p className="text-xs">
                        Equipment: {typeof ambulance.equipment === 'string' 
                          ? JSON.parse(ambulance.equipment).slice(0, 3).join(', ')
                          : ambulance.equipment.slice(0, 3).join(', ')}
                        {((typeof ambulance.equipment === 'string' ? JSON.parse(ambulance.equipment).length : ambulance.equipment.length) > 3) && '...'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors font-medium"
          >
            <Save size={18} />
            {loading ? 'Submitting Request...' : 'Submit Ambulance Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OutgoingAmbulanceForm;