import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, CheckCircle, ArrowLeft, Stethoscope, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../services/api';
import ConsultationPaymentModal from '../../components/ConsultationPaymentModal';

const RegisterPatient = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternative_phone: '',
    email: '',
    age: '',
    gender: 'Male',
    id_number: '',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    next_of_kin_relationship: '',
    county: '',
    town: '',
    address: '',
    house_number: '',
    initial_queue: 'nurse' // NEW: Default to nurse queue
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
    if (duplicateInfo) setDuplicateInfo(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Patient name is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!/^0[17]\d{8}$/.test(formData.phone)) {
      setError('Invalid phone number format (e.g., 0712345678)');
      return false;
    }
    if (formData.alternative_phone && !/^0[17]\d{8}$/.test(formData.alternative_phone)) {
      setError('Invalid alternative phone number format');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    if (!formData.age || formData.age < 0 || formData.age > 150) {
      setError('Please enter a valid age');
      return false;
    }
    if (!formData.id_number.trim()) {
      setError('ID/Passport number is required');
      return false;
    }
    if (!formData.next_of_kin_name.trim()) {
      setError('Next of kin name is required');
      return false;
    }
    if (!formData.next_of_kin_phone.trim()) {
      setError('Next of kin phone number is required');
      return false;
    }
    if (!/^0[17]\d{8}$/.test(formData.next_of_kin_phone)) {
      setError('Invalid next of kin phone number format');
      return false;
    }
    if (!formData.next_of_kin_relationship.trim()) {
      setError('Next of kin relationship is required');
      return false;
    }
    if (!formData.county.trim()) {
      setError('County is required');
      return false;
    }
    if (!formData.town.trim()) {
      setError('Town/City is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.house_number.trim()) {
      setError('House number is required');
      return false;
    }
    return true;
  };

  // First step: Validate form and show payment modal
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Store form data and show payment modal
    setPendingFormData({
      ...formData,
      age: parseInt(formData.age),
      alternative_phone: formData.alternative_phone.trim() || null,
      email: formData.email.trim() || null,
      next_of_kin_name: formData.next_of_kin_name.trim() || null,
      next_of_kin_phone: formData.next_of_kin_phone.trim() || null,
      next_of_kin_relationship: formData.next_of_kin_relationship.trim() || null,
      county: formData.county.trim() || null,
      town: formData.town.trim() || null,
      address: formData.address.trim() || null,
      house_number: formData.house_number.trim() || null,
      initial_queue: formData.initial_queue
    });

    setShowPaymentModal(true);
  };

  // Second step: After payment is confirmed, complete registration
  const handlePaymentComplete = async (paymentDetails) => {
    if (!pendingFormData) return;

    setShowPaymentModal(false);

    setLoading(true);
    setError(null);
    setSuccess(null);
    setDuplicateInfo(null);

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.REGISTER_PATIENT, {
        method: 'POST',
        body: JSON.stringify({
          ...pendingFormData,
          payment: paymentDetails // Include payment details
        })
      });

      const data = await response.json();

      if (data.success) {
        const queueName = data.assigned_to === 'nurse' ? 'Nurse' : 'Doctor';
        setSuccess({
          message: `Patient registered successfully and added to ${queueName} queue!`,
          queueNumber: data.queue?.queueNumber,
          patientName: data.patient.name,
          assignedTo: queueName
        });

        setFormData({
          name: '',
          phone: '',
          alternative_phone: '',
          email: '',
          age: '',
          gender: 'Male',
          id_number: '',
          next_of_kin_name: '',
          next_of_kin_phone: '',
          next_of_kin_relationship: '',
          county: '',
          town: '',
          address: '',
          house_number: '',
          initial_queue: 'nurse'
        });

        setTimeout(() => {
          switch (user?.role) {
            case 'doctor':
              navigate('/doctor/dashboard');
              break;
            case 'pharmacy':
              navigate('/pharmacy/dashboard');
              break;
            case 'lab':
              navigate('/lab/dashboard');
              break;
            case 'receptionist':
            case 'reception':
              navigate('/reception/dashboard');
              break;
            default:
              navigate('/reception/dashboard');
          }
        }, 2000);
      } else {
        if (data.code === 'DUPLICATE_ENTRY' || response.status === 409) {
          if (data.existingPatient) {
            setDuplicateInfo({
              message: data.error,
              patient: data.existingPatient,
              field: data.field
            });
          } else {
            setError(data.error || 'This patient already exists in the system');
          }
        } else {
          setError(data.error || 'Registration failed');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setPendingFormData(null);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setPendingFormData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Register New Patient</h1>
            <p className="text-slate-600">Add patient to the system and assign to queue</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-6 shadow-md">
            <div className="flex items-start gap-3">
              <CheckCircle size={24} className="text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-green-700 font-semibold text-lg mb-2">{success.message}</h3>
                <p className="text-green-600 mb-1">
                  <span className="font-semibold">Patient:</span> {success.patientName}
                </p>
                <p className="text-green-600 mb-1">
                  <span className="font-semibold">Queue Number:</span>{' '}
                  <span className="font-mono text-xl">{success.queueNumber}</span>
                </p>
                <p className="text-green-600">
                  <span className="font-semibold">Assigned to:</span> {success.assignedTo}
                </p>
                <p className="text-green-600 text-sm mt-3">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Duplicate Warning */}
        {duplicateInfo && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 shadow-md">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-yellow-800 font-semibold mb-2">{duplicateInfo.message}</p>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><span className="font-medium">Patient Number:</span> {duplicateInfo.patient.patient_number}</p>
                  <p><span className="font-medium">Name:</span> {duplicateInfo.patient.name}</p>
                  {duplicateInfo.patient.phone && (
                    <p><span className="font-medium">Phone:</span> {duplicateInfo.patient.phone}</p>
                  )}
                  {duplicateInfo.patient.id_number && (
                    <p><span className="font-medium">ID Number:</span> {duplicateInfo.patient.id_number}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-100 rounded-xl">
                <UserPlus size={24} className="text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Patient Information</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Queue Selection - NEW SECTION */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Initial Queue Assignment</h3>
              <p className="text-sm text-slate-600 mb-4">
                Choose where to send the patient first. Select Nurse if vitals need to be taken, or Doctor if vitals are already recorded.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nurse Queue Option */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, initial_queue: 'nurse' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.initial_queue === 'nurse'
                    ? 'border-teal-500 bg-teal-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-teal-300'
                    }`}
                  disabled={loading}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${formData.initial_queue === 'nurse' ? 'bg-teal-100' : 'bg-gray-100'
                      }`}>
                      <ClipboardList size={24} className={
                        formData.initial_queue === 'nurse' ? 'text-teal-600' : 'text-gray-600'
                      } />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className={`font-semibold mb-1 ${formData.initial_queue === 'nurse' ? 'text-teal-700' : 'text-slate-700'
                        }`}>
                        Nurse Queue
                      </h4>
                      <p className="text-sm text-slate-600">
                        Patient needs vitals taken (BP, temperature, weight, etc.)
                      </p>
                    </div>
                    {formData.initial_queue === 'nurse' && (
                      <CheckCircle size={20} className="text-teal-600 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Doctor Queue Option */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, initial_queue: 'doctor' }))}
                  className={`p-4 rounded-lg border-2 transition-all ${formData.initial_queue === 'doctor'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-blue-300'
                    }`}
                  disabled={loading}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${formData.initial_queue === 'doctor' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                      <Stethoscope size={24} className={
                        formData.initial_queue === 'doctor' ? 'text-blue-600' : 'text-gray-600'
                      } />
                    </div>
                    <div className="text-left flex-1">
                      <h4 className={`font-semibold mb-1 ${formData.initial_queue === 'doctor' ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                        Doctor Queue
                      </h4>
                      <p className="text-sm text-slate-600">
                        Vitals already taken or nurse unavailable
                      </p>
                    </div>
                    {formData.initial_queue === 'doctor' && (
                      <CheckCircle size={20} className="text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Basic Information</h3>

              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter patient's full name"
                  className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Primary Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0712345678"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500 mt-1">Format: 0712345678 or 0112345678</p>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Alternative Phone
                  </label>
                  <input
                    type="tel"
                    name="alternative_phone"
                    value={formData.alternative_phone}
                    onChange={handleChange}
                    placeholder="0112345678 (Optional)"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-2">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                  className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Age <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    min="0"
                    max="150"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Gender <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    ID/Passport <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="id_number"
                    value={formData.id_number}
                    onChange={handleChange}
                    placeholder="ID/Passport"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Next of Kin Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Next of Kin Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="next_of_kin_name"
                    value={formData.next_of_kin_name}
                    onChange={handleChange}
                    placeholder="Next of kin name"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Phone Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="next_of_kin_phone"
                    value={formData.next_of_kin_phone}
                    onChange={handleChange}
                    placeholder="0712345678"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Relationship <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="next_of_kin_relationship"
                    value={formData.next_of_kin_relationship}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Location Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    County <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    placeholder="e.g., Nairobi"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    Town/City <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="town"
                    value={formData.town}
                    onChange={handleChange}
                    placeholder="e.g., Westlands"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-medium mb-2">
                    Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address or description"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-2">
                    House Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleChange}
                    placeholder="e.g., A12"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-all"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Proceed to Payment</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.history.back()}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-slate-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <ConsultationPaymentModal
          patientData={pendingFormData}
          onPaymentComplete={handlePaymentComplete}
          onCancel={handlePaymentCancel}
          isReturningPatient={false}
        />
      )}
    </div>
  );
};

export default RegisterPatient;