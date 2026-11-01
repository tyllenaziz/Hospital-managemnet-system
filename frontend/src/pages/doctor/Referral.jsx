import { useState, useEffect } from 'react';
import { ArrowLeft, Send, AlertCircle, CheckCircle, Building2, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const CreateReferralPage = () => {
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const { queueId } = useParams();
  const location = useLocation();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    referring_hospital: '',
    referred_to_hospital: '',
    referred_to_department: '',
    referral_reason: '',
    clinical_summary: '',
    diagnosis: '',
    patient_condition: 'Stable',
    vital_signs: '',
    services_needed: [],
    investigations_done: '',
    current_medications: '',
    referring_doctor_name: user?.name || '',
    referring_doctor_phone: '',
    referring_doctor_email: user?.email || '',
    priority: 'Routine',
    expected_visit_date: '',
    follow_up_required: false
  });

  const servicesOptions = [
    'Admission',
    'X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
    'ECG',
    'Echocardiography',
    'Endoscopy',
    'Surgery',
    'Specialist Consultation',
    'ICU Care',
    'Dialysis',
    'Chemotherapy',
    'Radiotherapy',
    'Physiotherapy',
    'Blood Transfusion',
    'Other'
  ];

  useEffect(() => {
    if (queueId) {
      fetchPatientData();
    } else if (location.state?.patient) {
      setPatient(location.state.patient);
      setLoading(false);
    }
  }, [queueId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(
        `${API_BASE_URL}/queue/${queueId}/fetch`,
        { method: 'PUT' }
      );

      const data = await response.json();

      if (data.success && data.patient) {
        setPatient(data.patient);
        
        // Pre-fill some data if available from consultation
        if (data.patient.notes) {
          setFormData(prev => ({ ...prev, clinical_summary: data.patient.notes }));
        }
      } else {
        setError(data.error || 'Failed to load patient data');
      }
    } catch (err) {
      console.error('Error fetching patient:', err);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services_needed: prev.services_needed.includes(service)
        ? prev.services_needed.filter(s => s !== service)
        : [...prev.services_needed, service]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!patient) {
      setError('Patient information is missing');
      return;
    }

    if (formData.services_needed.length === 0) {
      setError('Please select at least one service needed');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await authenticatedFetch(`${API_BASE_URL}/referrals`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          patient_id: patient.patient_id || patient.id,
          queue_id: queueId || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/doctor/dashboard', {
            state: { message: 'Referral created successfully' }
          });
        }, 2000);
      } else {
        setError(data.error || 'Failed to create referral');
      }
    } catch (err) {
      console.error('Error creating referral:', err);
      setError('Failed to create referral. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-2 text-red-700 mb-3">
            <AlertCircle size={20} />
            <h3 className="font-semibold">Patient Not Found</h3>
          </div>
          <p className="text-red-600 text-sm mb-4">Unable to load patient information</p>
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="text-teal-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-800">Create Referral</h1>
            </div>
          </div>
          <div className="ml-12">
            <p className="text-gray-700 font-medium">{patient.name}</p>
            <p className="text-gray-600 text-sm">
              {patient.age} yrs • {patient.gender} • ID: {patient.id_number} • 
              {queueId && ` Queue: ${patient.queue_number}`}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={20} />
              <p className="font-medium">Referral created successfully! Redirecting...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Referral Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hospital Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-teal-600" />
              Hospital Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Referring Hospital <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="referring_hospital"
                  value={formData.referring_hospital}
                  onChange={handleChange}
                  placeholder="Your hospital name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Referred To Hospital <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="referred_to_hospital"
                  value={formData.referred_to_hospital}
                  onChange={handleChange}
                  placeholder="Destination hospital name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Department/Specialty
                </label>
                <input
                  type="text"
                  name="referred_to_department"
                  value={formData.referred_to_department}
                  onChange={handleChange}
                  placeholder="e.g., Cardiology, Neurology, Surgery"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Expected Visit Date
                </label>
                <input
                  type="date"
                  name="expected_visit_date"
                  value={formData.expected_visit_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Clinical Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-teal-600" />
              Clinical Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Reason for Referral <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="referral_reason"
                  value={formData.referral_reason}
                  onChange={handleChange}
                  placeholder="Brief reason why patient is being referred..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Clinical Summary <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="clinical_summary"
                  value={formData.clinical_summary}
                  onChange={handleChange}
                  placeholder="Detailed clinical history, symptoms, examination findings..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg h-32 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Diagnosis
                </label>
                <textarea
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  placeholder="Provisional or confirmed diagnosis..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Patient Condition <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="patient_condition"
                    value={formData.patient_condition}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Priority <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Vital Signs
                </label>
                <textarea
                  name="vital_signs"
                  value={formData.vital_signs}
                  onChange={handleChange}
                  placeholder="BP, Temp, Pulse, RR, SpO2, etc..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg h-20 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Investigations Done
                </label>
                <textarea
                  name="investigations_done"
                  value={formData.investigations_done}
                  onChange={handleChange}
                  placeholder="Lab tests, X-rays, scans done at this hospital..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Current Medications
                </label>
                <textarea
                  name="current_medications"
                  value={formData.current_medications}
                  onChange={handleChange}
                  placeholder="Medications patient is currently taking..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Services Needed */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Services Needed <span className="text-red-600">*</span>
            </h3>
            <p className="text-sm text-gray-600 mb-4">Select all services required for this patient</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {servicesOptions.map((service) => (
                <label
                  key={service}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                    formData.services_needed.includes(service)
                      ? 'bg-teal-50 border-teal-500 text-teal-700'
                      : 'bg-white border-gray-300 hover:border-teal-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.services_needed.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium">{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Referring Doctor Information */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Referring Doctor Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Doctor Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="referring_doctor_name"
                  value={formData.referring_doctor_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  name="referring_doctor_phone"
                  value={formData.referring_doctor_phone}
                  onChange={handleChange}
                  placeholder="0712345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="referring_doctor_email"
                  value={formData.referring_doctor_email}
                  onChange={handleChange}
                  placeholder="doctor@hospital.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="follow_up_required"
                  checked={formData.follow_up_required}
                  onChange={handleChange}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-gray-700 font-medium">Follow-up required after referral</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Referral...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Create Referral</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReferralPage;