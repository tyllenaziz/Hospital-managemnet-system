import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, UserPlus, Calendar, Phone, User, ArrowLeft, AlertCircle, FileText, FlaskConical, PlusCircle, CheckCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../services/api';
import NewVisitModal from '../../components/NewVisitModal';

const PatientList = () => {
  const navigate = useNavigate();
  const { authenticatedFetch, user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.PATIENTS);
      const data = await response.json();

      // Handle different response structures
      if (Array.isArray(data)) {
        setPatients(data);
      } else if (data && Array.isArray(data.patients)) {
        setPatients(data.patients);
      } else if (data && data.success && Array.isArray(data.patients)) {
        setPatients(data.patients);
      } else {
        console.warn('Unexpected API response structure:', data);
        setPatients([]);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // Ensure filteredPatients is always an array
  const filteredPatients = Array.isArray(patients) ? patients.filter(patient => {
    if (!patient || typeof patient !== 'object') return false;

    const matchesSearch =
      (patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phone && patient.phone.includes(searchTerm)) ||
      (patient.id_number && patient.id_number.includes(searchTerm)) ||
      (patient.patient_number && patient.patient_number.includes(searchTerm));

    const matchesFilter = filterGender === 'all' || patient.gender === filterGender;
    return matchesSearch && matchesFilter;
  }) : [];

  const getGenderColor = (gender) => {
    switch (gender) {
      case 'Male':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Female':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'Other':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTodaysVisits = () => {
    if (!Array.isArray(patients)) return 0;

    const today = new Date().toISOString().split('T')[0];
    return patients.filter(p => p && p.created_at && p.created_at.startsWith(today)).length;
  };

  // Function to get appropriate dashboard based on user role
  const getDashboardPath = () => {
    switch (user?.role) {
      case 'lab':
        return '/lab/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'pharmacy':
        return '/pharmacy/dashboard';
      case 'receptionist':
      default:
        return '/reception/dashboard';
    }
  };

  // Check if user can view lab history (doctor, pharmacy, lab)
  const canViewLabHistory = () => {
    return ['doctor', 'pharmacy', 'lab'].includes(user?.role);
  };

  // Check if user can view detailed patient information
  const canViewPatientDetails = () => {
    return ['doctor', 'pharmacy', 'lab', 'receptionist', 'nurse', 'admin'].includes(user?.role);
  };

  // Check if user can create new visits
  const canCreateVisit = () => {
    return ['receptionist', 'doctor', 'nurse', 'admin'].includes(user?.role);
  };

  // Get patient details link based on role
  const getPatientDetailsLink = (patientId) => {
    switch (user?.role) {
      case 'doctor':
        return `/doctor/patients/${patientId}`;
      case 'pharmacy':
        return `/pharmacy/patients/${patientId}`;
      case 'lab':
        return `/lab/patients/${patientId}`;
      case 'receptionist':
      default:
        return `/reception/patients/${patientId}`;
    }
  };

  // Get lab history link based on role
  const getLabHistoryLink = (patientId) => {
    switch (user?.role) {
      case 'doctor':
        return `/doctor/patient/${patientId}/lab-history`;
      case 'pharmacy':
        return `/pharmacy/patient/${patientId}/lab-history`;
      case 'lab':
        return `/lab/patient/${patientId}/history`;
      default:
        return null;
    }
  };

  // Safe patient data access
  const getPatientInitials = (patient) => {
    if (!patient || !patient.name) return '??';
    return patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getPatientName = (patient) => {
    return patient?.name || 'Unknown Patient';
  };

  const getPatientPhone = (patient) => {
    return patient?.phone || 'N/A';
  };

  const getPatientAge = (patient) => {
    return patient?.age || 'N/A';
  };

  const getPatientGender = (patient) => {
    return patient?.gender || 'Unknown';
  };

  const getPatientIdNumber = (patient) => {
    return patient?.id_number || 'N/A';
  };

  const getPatientNumber = (patient) => {
    return patient?.patient_number || 'N/A';
  };

  const getCreatedDate = (patient) => {
    return patient?.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(getDashboardPath())}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Patient Records</h1>
            <p className="text-sm text-slate-600">View and manage patient information</p>
          </div>

          {/* Register Patient Button for roles that have access */}
          {user?.role !== 'receptionist' && (
            <Link
              to={`/${user?.role}/register-patient`}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition text-sm font-medium"
            >
              <UserPlus size={16} />
              Register Patient
            </Link>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Search by name, phone, ID number, or patient number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patient Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-teal-200 shadow-sm">
            <div className="flex items-center justify-between">
              <User className="text-teal-600" size={18} />
              <span className="text-2xl font-bold text-slate-800">{Array.isArray(patients) ? patients.length : 0}</span>
            </div>
            <h3 className="text-slate-600 text-sm mt-1">Total Patients</h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <Calendar className="text-blue-600" size={18} />
              <span className="text-2xl font-bold text-slate-800">{getTodaysVisits()}</span>
            </div>
            <h3 className="text-slate-600 text-sm mt-1">Today's Visits</h3>
          </div>

          <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <Phone className="text-green-600" size={18} />
              <span className="text-2xl font-bold text-slate-800">{filteredPatients.length}</span>
            </div>
            <h3 className="text-slate-600 text-sm mt-1">Search Results</h3>
          </div>
        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-teal-50">
            <h2 className="text-lg font-semibold text-slate-800">
              All Patients ({filteredPatients.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
              <p className="text-slate-600 mt-3 text-sm">Loading patients...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Patient Number</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Patient Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Phone</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Age</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Gender</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">ID Number</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Registered</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-blue-50 transition">
                      <td className="px-3 py-2">
                        <span className="text-slate-800 font-mono text-xs font-semibold bg-slate-100 px-2 py-1 rounded">
                          {getPatientNumber(patient)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-teal-600 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xs">
                              {getPatientInitials(patient)}
                            </span>
                          </div>
                          <span className="text-slate-800 font-medium text-sm">{getPatientName(patient)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-sm">{getPatientPhone(patient)}</td>
                      <td className="px-3 py-2 text-slate-600 text-sm">{getPatientAge(patient)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getGenderColor(getPatientGender(patient))}`}>
                          {getPatientGender(patient)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-slate-600 font-mono text-xs">{getPatientIdNumber(patient)}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 text-xs">
                        {getCreatedDate(patient)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {/* Patient Details Link - Available for all roles */}
                          {canViewPatientDetails() && (
                            <Link
                              to={getPatientDetailsLink(patient.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md transition"
                            >
                              <Eye size={14} />
                              Details
                            </Link>
                          )}

                          {/* Lab History Link - Only for doctor, pharmacy, lab */}
                          {canViewLabHistory() && (
                            <Link
                              to={getLabHistoryLink(patient.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition"
                            >
                              <FlaskConical size={14} />
                              Lab History
                            </Link>
                          )}

                          {/* New Visit Button - For reception, doctor, nurse */}
                          {canCreateVisit() && (
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowNewVisitModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition"
                            >
                              <PlusCircle size={14} />
                              New Visit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredPatients.length === 0 && (
            <div className="p-8 text-center">
              <User className="mx-auto text-slate-300 mb-3" size={40} />
              <h3 className="text-slate-800 font-semibold mb-1 text-sm">
                {Array.isArray(patients) && patients.length > 0 ? 'No patients match your search' : 'No patients found'}
              </h3>
              <p className="text-slate-600 text-xs">
                {Array.isArray(patients) && patients.length > 0
                  ? 'Try adjusting your search criteria'
                  : 'No patients have been registered yet'}
              </p>
            </div>
          )}
        </div>

        {/* New Visit Modal */}
        {showNewVisitModal && selectedPatient && (
          <NewVisitModal
            patient={selectedPatient}
            onClose={() => {
              setShowNewVisitModal(false);
              setSelectedPatient(null);
            }}
            onSuccess={(data) => {
              showToast(`Visit created! Queue: ${data.queue.queueNumber}`);
            }}
          />
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              } text-white animate-pulse`}>
              <CheckCircle size={20} />
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast({ show: false, message: '', type: 'success' })}
                className="ml-2 hover:opacity-80"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;