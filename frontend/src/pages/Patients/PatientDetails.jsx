import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Calendar, FileText, Activity, Pill, FlaskConical, AlertCircle, MapPin, Stethoscope, Heart, UserPlus, PlusCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../services/api';
import FollowUpModal from '../../components/FollowUpModal';
import ChronicEnrollmentModal from '../../components/ChronicEnrollmentModal';
import NewVisitModal from '../../components/NewVisitModal';

const PatientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authenticatedFetch } = useAuth();
  const [patient, setPatient] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [visitStats, setVisitStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchPatientDetails = useCallback(async () => {
    if (!id) {
      setError('Patient ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch patient details
      const patientResponse = await authenticatedFetch(`${API_ENDPOINTS.PATIENTS}/${id}`);

      if (!patientResponse.ok) {
        throw new Error(`Failed to fetch patient: ${patientResponse.status}`);
      }

      const patientData = await patientResponse.json();

      // Handle different response formats
      if (patientData.success && patientData.patient) {
        setPatient(patientData.patient);
      } else if (patientData.patient) {
        setPatient(patientData.patient);
      } else {
        setPatient(patientData);
      }

      // Fetch visit history
      try {
        const visitsResponse = await authenticatedFetch(`${API_ENDPOINTS.PATIENTS}/${id}/visits`);

        if (visitsResponse.ok) {
          const visitsData = await visitsResponse.json();

          if (visitsData.success) {
            setVisitHistory(visitsData.visit_history || []);
            setVisitStats(visitsData.statistics || null);
          }
        }
      } catch (visitErr) {
        console.error('Error fetching visit history:', visitErr);
        // Don't fail the whole page if visit history fails
        setVisitHistory([]);
      }

    } catch (err) {
      console.error('Error fetching patient:', err);
      setError(err.message || 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  }, [id, authenticatedFetch]);

  useEffect(() => {
    if (id) {
      fetchPatientDetails();
    }
  }, [id, fetchPatientDetails]);

  const getDepartmentBadge = (dept) => {
    const styles = {
      doctor: 'bg-blue-100 text-blue-700 border-blue-300',
      nurse: 'bg-teal-100 text-teal-700 border-teal-300',
      lab: 'bg-purple-100 text-purple-700 border-purple-300',
      pharmacy: 'bg-green-100 text-green-700 border-green-300',
      billing: 'bg-orange-100 text-orange-700 border-orange-300'
    };
    return styles[dept] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getDepartmentIcon = (dept) => {
    const icons = {
      doctor: Stethoscope,
      nurse: Heart,
      lab: FlaskConical,
      pharmacy: Pill,
      billing: FileText
    };
    return icons[dept] || Activity;
  };

  const getStatusBadge = (status) => {
    const styles = {
      done: 'bg-green-100 text-green-700 border-green-300',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-300',
      waiting: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300'
    };
    return styles[status] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <p className="text-slate-600 mt-2 text-sm">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-400 mb-3" size={48} />
          <h3 className="text-slate-800 font-semibold mb-1 text-lg">Patient not found</h3>
          <p className="text-slate-600 mb-4 text-sm">{error || 'Unable to load patient information'}</p>
          <button
            onClick={() => navigate('/reception/patients')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-medium text-sm"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/reception/patients')}
          className="flex items-center gap-1 text-slate-600 hover:text-teal-700 transition font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Back to Patients
        </button>

        {/* Patient Info Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-teal-600 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {getInitials(patient.name)}
                </span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">{patient.name || 'Unknown Patient'}</h1>
                <p className="text-teal-100 text-sm">
                  {patient.patient_number ? `Patient Number ${patient.patient_number}` : `ID: #${patient.id}`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Phone className="text-blue-600" size={16} />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Phone Number</p>
                  <p className="text-slate-800 font-semibold text-sm">{patient.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <User className="text-purple-600" size={16} />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">ID Number</p>
                  <p className="text-slate-800 font-semibold text-sm">{patient.id_number || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Calendar className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Age / Gender</p>
                  <p className="text-slate-800 font-semibold text-sm">
                    {patient.age || 'N/A'} / {patient.gender || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <Calendar className="text-teal-600" size={16} />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Registered Date</p>
                  <p className="text-slate-800 font-semibold text-sm">
                    {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <Calendar className="text-orange-600" size={16} />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Last Updated</p>
                  <p className="text-slate-800 font-semibold text-sm">
                    {patient.updated_at ? new Date(patient.updated_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-pink-100 rounded-lg">
                  <FileText className="text-pink-600" size={16} />
                </div>
                <div>
                  <p className="text-slate-600 text-xs">Total Visits</p>
                  <p className="text-slate-800 font-semibold text-sm">
                    {visitStats?.total_visits || visitHistory.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions for Follow-up and Enrollment */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-purple-600" size={20} />
              <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Start a new visit, schedule follow-ups, or enroll in chronic care programs.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowNewVisitModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition"
            >
              <PlusCircle size={20} />
              New Visit
            </button>
            <button
              onClick={() => setShowFollowUpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition"
            >
              <Calendar size={18} />
              Schedule Follow-up
            </button>
            <button
              onClick={() => setShowEnrollModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition"
            >
              <UserPlus size={18} />
              Enroll in Chronic Clinic
            </button>
          </div>
        </div>



        {/* Patient Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Personal Information */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User className="text-teal-600" size={20} />
              Personal Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-600 text-xs mb-1">Full Name</p>
                <p className="text-slate-800 text-sm font-medium">{patient.name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-600 text-xs mb-1">Age</p>
                  <p className="text-slate-800 text-sm font-medium">{patient.age || 'N/A'} years</p>
                </div>
                <div>
                  <p className="text-slate-600 text-xs mb-1">Gender</p>
                  <p className="text-slate-800 text-sm font-medium">{patient.gender || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-xs mb-1">ID/Passport Number</p>
                <p className="text-slate-800 text-sm font-medium">{patient.id_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Phone className="text-teal-600" size={20} />
              Contact Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-600 text-xs mb-1">Primary Phone</p>
                <p className="text-slate-800 text-sm font-medium">{patient.phone || 'N/A'}</p>
              </div>
              {patient.alternative_phone && (
                <div>
                  <p className="text-slate-600 text-xs mb-1">Alternative Phone</p>
                  <p className="text-slate-800 text-sm font-medium">{patient.alternative_phone}</p>
                </div>
              )}
              {patient.email && (
                <div>
                  <p className="text-slate-600 text-xs mb-1">Email Address</p>
                  <p className="text-slate-800 text-sm font-medium">{patient.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <MapPin className="text-teal-600" size={20} />
              Address Information
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-600 text-xs mb-1">County</p>
                  <p className="text-slate-800 text-sm font-medium capitalize">{patient.county || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-xs mb-1">Town</p>
                  <p className="text-slate-800 text-sm font-medium capitalize">{patient.town || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-xs mb-1">Address</p>
                <p className="text-slate-800 text-sm font-medium capitalize">{patient.address || 'N/A'}</p>
              </div>
              {patient.house_number && (
                <div>
                  <p className="text-slate-600 text-xs mb-1">House Number</p>
                  <p className="text-slate-800 text-sm font-medium">{patient.house_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Next of Kin Information */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <User className="text-teal-600" size={20} />
              Next of Kin
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-600 text-xs mb-1">Name</p>
                <p className="text-slate-800 text-sm font-medium">{patient.next_of_kin_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-600 text-xs mb-1">Phone Number</p>
                <p className="text-slate-800 text-sm font-medium">{patient.next_of_kin_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-600 text-xs mb-1">Relationship</p>
                <p className="text-slate-800 text-sm font-medium capitalize">{patient.next_of_kin_relationship || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visit History */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-teal-600" size={20} />
              Visit History ({visitHistory.length})
            </h2>
          </div>

          <div className="p-4">
            {visitHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto text-slate-300 mb-3" size={36} />
                <h3 className="text-slate-800 font-semibold mb-1 text-sm">No visit history</h3>
                <p className="text-slate-600 text-xs">This patient has no recorded visits yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visitHistory.map((visit) => {
                  const DeptIcon = getDepartmentIcon(visit.department);
                  return (
                    <div
                      key={visit.id}
                      className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-teal-300 transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                            <DeptIcon className="text-teal-600" size={18} />
                          </div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDepartmentBadge(visit.department)}`}>
                              {visit.department.toUpperCase()}
                            </span>
                            <p className="text-slate-500 text-xs mt-1">Queue: {visit.queue_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600 text-xs">{formatDate(visit.visit_date)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(visit.status)}`}>
                            {visit.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-slate-600 text-xs mb-1">Attended By</p>
                          <p className="text-slate-800 font-medium text-sm">{visit.attended_by}</p>
                        </div>

                        <div className="flex gap-3">
                          {visit.has_lab_tests && (
                            <div className="flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                              <FlaskConical size={14} />
                              <span>Lab Tests</span>
                            </div>
                          )}
                          {visit.has_prescription && (
                            <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                              <Pill size={14} />
                              <span>Prescription</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {visit.vitals && Object.values(visit.vitals).some(v => v) && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-slate-600 text-xs mb-2 font-medium">Vitals Recorded</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {visit.vitals.blood_pressure && (
                              <div className="text-xs">
                                <span className="text-slate-500">BP:</span>{' '}
                                <span className="text-slate-800 font-medium">{visit.vitals.blood_pressure}</span>
                              </div>
                            )}
                            {visit.vitals.temperature && (
                              <div className="text-xs">
                                <span className="text-slate-500">Temp:</span>{' '}
                                <span className="text-slate-800 font-medium">{visit.vitals.temperature}°C</span>
                              </div>
                            )}
                            {visit.vitals.pulse_rate && (
                              <div className="text-xs">
                                <span className="text-slate-500">Pulse:</span>{' '}
                                <span className="text-slate-800 font-medium">{visit.vitals.pulse_rate} bpm</span>
                              </div>
                            )}
                            {visit.vitals.weight && (
                              <div className="text-xs">
                                <span className="text-slate-500">Weight:</span>{' '}
                                <span className="text-slate-800 font-medium">{visit.vitals.weight} kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Modal */}
        {showFollowUpModal && (
          <FollowUpModal
            patient={patient}
            onClose={() => setShowFollowUpModal(false)}
            onSuccess={() => showToast('Follow-up scheduled successfully!')}
          />
        )}

        {/* Chronic Enrollment Modal */}
        {showEnrollModal && (
          <ChronicEnrollmentModal
            patient={patient}
            onClose={() => setShowEnrollModal(false)}
            onSuccess={() => showToast('Patient enrolled in chronic care clinic successfully!')}
          />
        )}

        {/* New Visit Modal */}
        {showNewVisitModal && (
          <NewVisitModal
            patient={patient}
            onClose={() => setShowNewVisitModal(false)}
            onSuccess={(data) => {
              showToast(`Visit created! Queue: ${data.queue.queueNumber}`);
              fetchPatientDetails(); // Refresh visit history
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

export default PatientDetails;