import { useState, useEffect } from 'react'
import { AlertCircle, Calendar, UserPlus, Building2, Car, Save, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import FollowUpModal from '../../components/FollowUpModal';
import ChronicEnrollmentModal from '../../components/ChronicEnrollmentModal';

// Import components
import ConsultationHeader from './components/ConsultationHeader';
import VitalsSection from './components/VitalsSection';
import LabResultsSection from './components/LabResultsSection';
import NotesSection from './components/NotesSection';
import ConsultationActionCard from './components/ConsultationActionCard';
import DiagnosisModal from './components/DiagnosisModal';
import PrescriptionModal from './components/PrescriptionModal';
import LabOrderModal from './components/LabOrderModal';
import ImagingOrderModal from './components/ImagingOrderModal';

const ConsultationPage = () => {
  const { authenticatedFetch, user, API_BASE_URL } = useAuth();
  const navigate = useNavigate();
  const { queueId } = useParams();

  // Core state
  const [currentPatient, setCurrentPatient] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [labResults, setLabResults] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [labTestSearch, setLabTestSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingVitals, setSavingVitals] = useState(false);
  const [isReopened, setIsReopened] = useState(false);

  // Consultation data with multi-diagnosis support
  const [consultationData, setConsultationData] = useState({
    notes: '',
    diagnoses: [], // New: array of diagnosis objects
    prescription_items: [],
    lab_tests: [],
    imaging_orders: [] // New: imaging/radiology orders
  });

  // Vitals data
  const [vitalsData, setVitalsData] = useState({
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
    notes: ''
  });

  // Modal visibility
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [showImagingModal, setShowImagingModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Initial data fetching
  useEffect(() => {
    if (queueId) {
      fetchPatientData();
      fetchMedicines();
      fetchLabTests();
      fetchVitals();
    }
  }, [queueId]);

  // Auto-calculate BMI
  useEffect(() => {
    if (vitalsData.weight && vitalsData.height) {
      const heightInMeters = parseFloat(vitalsData.height) / 100;
      const bmi = (parseFloat(vitalsData.weight) / (heightInMeters * heightInMeters)).toFixed(2);
      if (!isNaN(bmi) && isFinite(bmi)) {
        setVitalsData(prev => ({ ...prev, bmi }));
      }
    }
  }, [vitalsData.weight, vitalsData.height]);

  // Fetch functions
  const fetchVitals = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/queue/${queueId}/vitals`);
      const data = await response.json();

      if (data.success && data.vitals) {
        setVitals(data.vitals);
        setVitalsData({
          blood_pressure_systolic: data.vitals.blood_pressure_systolic || '',
          blood_pressure_diastolic: data.vitals.blood_pressure_diastolic || '',
          temperature: data.vitals.temperature || '',
          pulse_rate: data.vitals.pulse_rate || '',
          respiratory_rate: data.vitals.respiratory_rate || '',
          weight: data.vitals.weight || '',
          height: data.vitals.height || '',
          blood_sugar: data.vitals.blood_sugar || '',
          oxygen_saturation: data.vitals.oxygen_saturation || '',
          bmi: data.vitals.bmi || '',
          notes: data.vitals.notes || ''
        });
      }
    } catch (err) {
      console.error('Error fetching vitals:', err);
    }
  };

  const handleSaveVitals = async () => {
    try {
      setSavingVitals(true);
      const response = await authenticatedFetch(
        `${API_BASE_URL}/queue/${queueId}/vitals`,
        { method: 'POST', body: JSON.stringify(vitalsData) }
      );

      const data = await response.json();
      if (data.success) {
        setVitals(data.vitals);
        setShowVitalsForm(false);
        showToast('Vitals updated successfully!');
        await fetchVitals();
      } else {
        showToast(data.error || 'Failed to save vitals', 'error');
      }
    } catch (err) {
      console.error('Error saving vitals:', err);
      showToast('Failed to save vitals', 'error');
    } finally {
      setSavingVitals(false);
    }
  };

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(
        `${API_BASE_URL}/queue/${queueId}/fetch`,
        { method: 'PUT' }
      );

      const data = await response.json();

      if (data.success && data.patient) {
        const patientHasLabResults = hasLabResults(data.patient);

        setCurrentPatient(data.patient);
        setIsReopened(data.isReopened || false);
        setLabResults(null);

        let consultationUpdate = {
          notes: data.patient.notes || '',
          diagnoses: [],
          prescription_items: [],
          lab_tests: [],
          imaging_orders: []
        };

        // Load existing prescription data if reopened
        if (data.isReopened && data.existingPrescription) {
          const prescription = data.existingPrescription;
          consultationUpdate.notes = prescription.notes || data.patient.notes || '';

          // Convert old text diagnosis to new format if present
          if (prescription.diagnosis) {
            consultationUpdate.diagnoses = [{
              diagnosis_code_id: null,
              code: 'LEGACY',
              description: prescription.diagnosis,
              category: 'Migrated',
              is_primary: true,
              custom_diagnosis: prescription.diagnosis
            }];
          }

          if (prescription.items && prescription.items.length > 0) {
            consultationUpdate.prescription_items = prescription.items.map(item => ({
              medicine_id: item.medicine_id || '',
              custom_medicine_name: item.custom_medicine_name || '',
              medicine_name: item.medicine_name || '',
              quantity: item.quantity || 1,
              dosage: item.dosage || '',
              duration: item.duration || '',
              instructions: item.instructions || ''
            }));
          }
        }

        // Load existing lab order data if reopened
        if (data.isReopened && data.existingLabOrder && !patientHasLabResults) {
          const labOrder = data.existingLabOrder;
          if (labOrder.tests && labOrder.tests.length > 0) {
            consultationUpdate.lab_tests = labOrder.tests.map(t => String(t.test_id || t.id));
          }
        }

        setConsultationData(consultationUpdate);

        if (patientHasLabResults) {
          await fetchPatientLabResults(data.patient.patient_id);
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

  const fetchMedicines = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/medicines`);
      const data = await response.json();
      if (data.success && Array.isArray(data.medicines)) {
        setMedicines(data.medicines);
      } else if (Array.isArray(data)) {
        setMedicines(data);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const fetchLabTests = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/lab/tests`);
      const data = await response.json();
      if (data.success && Array.isArray(data.tests)) {
        setLabTests(data.tests);
      } else if (Array.isArray(data)) {
        setLabTests(data);
      }
    } catch (err) {
      console.error('Error fetching lab tests:', err);
    }
  };

  const fetchPatientLabResults = async (patientId) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/lab/results/patient/${patientId}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setLabResults(data[0]);
      }
    } catch (err) {
      console.error('Error fetching lab results:', err);
    }
  };

  const hasLabResults = (patient) => {
    return patient.notes && patient.notes.includes('[LAB RESULTS READY');
  };

  // Prescription handlers
  const handleAddPrescriptionItem = (newItem = null) => {
    setConsultationData(prev => ({
      ...prev,
      prescription_items: [
        ...prev.prescription_items,
        newItem || {
          medicine_id: '',
          custom_medicine_name: '',
          quantity: 1,
          dosage: '',
          duration: '',
          instructions: ''
        }
      ]
    }));
  };

  const handleRemovePrescriptionItem = (index) => {
    setConsultationData(prev => ({
      ...prev,
      prescription_items: prev.prescription_items.filter((_, i) => i !== index)
    }));
  };

  const handlePrescriptionItemChange = (index, field, value) => {
    setConsultationData(prev => ({
      ...prev,
      prescription_items: prev.prescription_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Lab test handlers
  const handleAddLabTest = (testId = '') => {
    setConsultationData(prev => ({
      ...prev,
      lab_tests: [...prev.lab_tests, testId]
    }));
  };

  const handleRemoveLabTest = (index) => {
    setConsultationData(prev => ({
      ...prev,
      lab_tests: prev.lab_tests.filter((_, i) => i !== index)
    }));
  };

  const handleLabTestChange = (index, value) => {
    setConsultationData(prev => ({
      ...prev,
      lab_tests: prev.lab_tests.map((test, i) => i === index ? value : test)
    }));
  };

  // Diagnosis handler
  const handleDiagnosesChange = (newDiagnoses) => {
    setConsultationData(prev => ({
      ...prev,
      diagnoses: newDiagnoses
    }));
  };

  // Notes handler
  const handleNotesChange = (notes) => {
    setConsultationData(prev => ({ ...prev, notes }));
  };

  // Complete consultation
  const handleCompleteConsultation = async () => {
    if (!currentPatient) return;

    try {
      setSaving(true);
      setError(null);

      const patientHasReturnedLabResults = Boolean(labResults) || hasLabResults(currentPatient);

      const validPrescriptionItems = consultationData.prescription_items.filter(
        item => (item.medicine_id !== '' || item.custom_medicine_name?.trim() !== '') && item.quantity > 0
      );

      const validLabTests = patientHasReturnedLabResults
        ? []
        : consultationData.lab_tests.filter(test => test !== '');

      const hasLabTests = validLabTests.length > 0;
      const hasPrescription = validPrescriptionItems.length > 0;

      // Build diagnosis string from selected diagnoses (for backward compatibility)
      const diagnosisText = consultationData.diagnoses
        .map(d => d.is_primary ? `[PRIMARY] ${d.code}: ${d.description}` : `${d.code}: ${d.description}`)
        .join('\n');

      let endpoint;
      let payload;

      if (hasLabTests) {
        endpoint = `${API_BASE_URL}/queue/${currentPatient.id}/complete-with-lab`;
        payload = {
          notes: consultationData.notes,
          diagnosis: diagnosisText,
          diagnoses: consultationData.diagnoses, // New: structured diagnoses
          lab_tests: validLabTests
        };
      } else if (hasPrescription) {
        endpoint = `${API_BASE_URL}/queue/${currentPatient.id}/complete`;
        payload = {
          notes: consultationData.notes,
          diagnosis: diagnosisText,
          diagnoses: consultationData.diagnoses,
          prescription_items: validPrescriptionItems
        };
      } else {
        endpoint = `${API_BASE_URL}/queue/${currentPatient.id}/complete`;
        payload = {
          notes: consultationData.notes,
          diagnosis: diagnosisText,
          diagnoses: consultationData.diagnoses
        };
      }

      const response = await authenticatedFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        showToast(isReopened ? 'Consultation updated successfully!' : 'Consultation completed successfully!');

        // Delay navigation to let user see the success message
        setTimeout(() => {
          navigate('/doctor/dashboard', {
            state: { message: isReopened ? 'Consultation updated successfully' : 'Consultation completed successfully' }
          });
        }, 2000);
      } else {
        setError(data.error || 'Failed to complete consultation');
      }
    } catch (err) {
      console.error('Error completing consultation:', err);
      setError(err.message || 'Failed to complete consultation');
    } finally {
      setSaving(false);
    }
  };

  // Filtered lists
  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    med.barcode?.includes(medicineSearch)
  );

  const filteredLabTests = labTests.filter(test =>
    test.test_name.toLowerCase().includes(labTestSearch.toLowerCase()) ||
    test.test_code?.toLowerCase().includes(labTestSearch.toLowerCase())
  );

  // Navigation handlers
  const handleAmbulanceRequest = () => {
    navigate('/doctor/ambulance-request/new', {
      state: { patient: currentPatient, fromConsultation: true }
    });
  };

  // Reopened banner
  const ReopenedBanner = () => (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">
            <strong>Consultation Reopened:</strong> This consultation was previously completed.
            All previous prescriptions and lab orders have been loaded for editing.
          </p>
        </div>
      </div>
    </div>
  );

  // Loading state
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

  // Error state
  if (error && !currentPatient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-2 text-red-700 mb-3">
            <AlertCircle size={20} />
            <h3 className="font-semibold">Error Loading Patient</h3>
          </div>
          <p className="text-red-600 text-sm mb-4">{error}</p>
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
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <ConsultationHeader
          currentPatient={currentPatient}
          isReopened={isReopened}
          saving={saving}
          onSave={handleCompleteConsultation}
          onAmbulanceRequest={handleAmbulanceRequest}
        />

        {isReopened && <ReopenedBanner />}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Vitals Section */}
        <VitalsSection
          vitals={vitals}
          vitalsData={vitalsData}
          setVitalsData={setVitalsData}
          showVitalsForm={showVitalsForm}
          setShowVitalsForm={setShowVitalsForm}
          savingVitals={savingVitals}
          onSaveVitals={handleSaveVitals}
          onRefreshVitals={fetchVitals}
        />

        {/* Lab Results Section */}
        <LabResultsSection
          labResults={labResults}
          patientId={currentPatient?.patient_id}
        />

        {/* Notes Section - Always visible */}
        <NotesSection
          notes={consultationData.notes}
          onNotesChange={handleNotesChange}
        />

        {/* Action Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ConsultationActionCard
            type="diagnosis"
            count={consultationData.diagnoses.length}
            items={consultationData.diagnoses}
            onClick={() => setShowDiagnosisModal(true)}
          />
          <ConsultationActionCard
            type="prescription"
            count={consultationData.prescription_items.length}
            items={consultationData.prescription_items}
            onClick={() => setShowPrescriptionModal(true)}
          />
          {!labResults && (
            <ConsultationActionCard
              type="lab"
              count={consultationData.lab_tests.filter(t => t.lab_test_id).length}
              items={consultationData.lab_tests.filter(t => t.lab_test_id)}
              onClick={() => setShowLabOrderModal(true)}
            />
          )}
          <ConsultationActionCard
            type="imaging"
            count={(consultationData.imaging_orders || []).length}
            items={consultationData.imaging_orders || []}
            onClick={() => setShowImagingModal(true)}
          />
        </div>
        {/* Follow-up & Chronic Care Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-purple-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Follow-up & Chronic Care</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Schedule follow-up appointments or enroll patient in chronic care clinics for ongoing management.
          </p>
          <div className="flex flex-wrap gap-3">
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

        {/* Action Buttons */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/doctor/referral/create/${queueId}`, {
                state: { patient: currentPatient }
              })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition"
            >
              <Building2 size={18} />
              Create Referral
            </button>

            <button
              onClick={handleAmbulanceRequest}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition"
            >
              <Car size={18} />
              Request Ambulance
            </button>

            <button
              onClick={handleCompleteConsultation}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-sm transition"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>{isReopened ? 'Update Consultation' : 'Complete Consultation'}</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            <strong>Note:</strong> {isReopened
              ? "Changes will update the existing prescription/lab order. Patient won't be duplicated in other queues."
              : 'Create a referral if patient needs services not available at this facility. Request ambulance for patient transfers to other facilities.'}
          </p>
        </div>

        {/* Modals */}
        {showFollowUpModal && (
          <FollowUpModal
            patient={currentPatient}
            onClose={() => setShowFollowUpModal(false)}
            onSuccess={() => showToast('Follow-up scheduled successfully!')}
          />
        )}

        {showEnrollModal && (
          <ChronicEnrollmentModal
            patient={currentPatient}
            onClose={() => setShowEnrollModal(false)}
            onSuccess={() => showToast('Patient enrolled in chronic care clinic successfully!')}
          />
        )}

        {/* Diagnosis Modal */}
        <DiagnosisModal
          isOpen={showDiagnosisModal}
          onClose={() => setShowDiagnosisModal(false)}
          selectedDiagnoses={consultationData.diagnoses}
          onSave={handleDiagnosesChange}
        />

        {/* Prescription Modal */}
        <PrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          prescriptionItems={consultationData.prescription_items}
          medicines={medicines}
          onSave={(items) => setConsultationData(prev => ({ ...prev, prescription_items: items }))}
        />

        {/* Lab Order Modal */}
        <LabOrderModal
          isOpen={showLabOrderModal}
          onClose={() => setShowLabOrderModal(false)}
          selectedTests={consultationData.lab_tests}
          onSave={(tests) => setConsultationData(prev => ({ ...prev, lab_tests: tests }))}
        />

        {/* Imaging Order Modal */}
        <ImagingOrderModal
          isOpen={showImagingModal}
          onClose={() => setShowImagingModal(false)}
          selectedImaging={consultationData.imaging_orders}
          onSave={(orders) => setConsultationData(prev => ({ ...prev, imaging_orders: orders }))}
        />

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-4 right-4 z-50 animate-pulse">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              } text-white`}>
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

export default ConsultationPage;
