import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import ModuleGuard from '../components/ModuleGuard';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SystemSettings from '../components/Settings';
import { getTenantAwareLoginPath } from '../utils/tenantContext';

// Auth Pages
import Login from '../pages/Auth/Login';

// Dashboard Pages
import AdminDashboard from '../pages/Dashboard/AdminDashboard';
import DoctorDashboard from '../pages/Dashboard/DoctorDashboard';
import ReceptionDashboard from '../pages/Dashboard/ReceptionDashboard';
import PharmacyDashboard from '../pages/Dashboard/PharmacyDashboard';
import LabDashboard from '../pages/Dashboard/LabDashboard';
import AdminReports from '../pages/Dashboard/AdminReports';

import PrescriptionList from '../pages/pharmacy/PrescriptionList';
import PrescriptionDetails from '../pages/pharmacy/PrescriptionDetails';
import DoctorsPrescription from '../pages/doctor/DoctorPrescriptions';
import PrescriptionDetailsView from '../pages/doctor/DoctorPrescriptionDetails';
import ConsultationPage from '../pages/doctor/ConsultationPage';
import CreateReferral from '../pages/doctor/Referral';
import ReferralListPage from '../pages/doctor/ReferralListPage';
import ReferralDetailsPage from '../pages/doctor/ReferralDetailsPage';

// Nurse Pages
import NurseDashboard from '../pages/Dashboard/NurseDashboard';
import VitalsRecording from '../pages/Patients/VitalsRecording';

// Lab Pages
import LabResults from '../pages/Lab/LabResults';
import LabOrderDetails from '../pages/Lab/LabOrderDetails';
import PatientLabHistory from '../pages/Lab/PatientLabHistory';
import LabTestManagement from '../pages/Lab/LabTestManagement';
import LabTestResultsEntry from '../pages/Lab/LabTestResultsEntry';
import LabResultsPrint from '../components/LabResultsPrint';

// Patient Pages
import PatientList from '../pages/Patients/PatientList';
import PatientRegistration from '../pages/Patients/RegisterPatient';
import PatientDetails from '../pages/Patients/PatientDetails';
import QueueManagement from '../pages/Patients/QueueManagement';

import DispensePrescription from '../pages/pharmacy/DispensePrescription';
import DirectSale from '../pages/pharmacy/DirectSale';
import DispensedPrescriptions from '../pages/pharmacy/DispensedPrescriptions';
import Receipt from '../components/Receipt';
import BillingPage from '../pages/Patients/BillingManagement';
import BillReceipt from '../components/BillingReceipt';
import PatientBills from '../pages/Patients/PatientBills';
import PatientBillsReceipt from '../components/PatientBillsReceipt';

// Inventory Pages
import InventoryDashboard from '../pages/Inventory/InventoryDashboard';
import MedicineList from '../pages/Inventory/MedicineList';
import EquipmentList from '../pages/Inventory/EquipmentList';
import AddMedicine from '../pages/Inventory/AddMedicine';
import AddEquipment from '../pages/Inventory/AddEquipment';
import BarcodeScannerView from '../pages/Inventory/BarcodeScannerView';
import DirectSalesList from '../pages/Inventory/DirectSalesList';

// Attendance Pages
import EmployeeAttendanceView from '../pages/Attendance/EmployeeAttendanceView';

// Admin Pages
import AddStaff from '../pages/Attendance/AddStaff';

// Ambulance Pages
import AmbulanceList from '../pages/ambulance/AmbulanceList';
import AmbulanceRequestList from '../pages/ambulance/AmbulanceRequestList';
import OutgoingAmbulanceForm from '../pages/ambulance/OutgoingAmbulanceForm';
import IncomingAmbulanceForm from '../pages/ambulance/IncomingAmbulanceForm';
import RegisterPatient from '../pages/Patients/RegisterPatient';

// Chronic Care Pages
import ClinicManagement from '../pages/ChronicCare/ClinicManagement';
import EnrollPatient from '../pages/ChronicCare/EnrollPatient';
import NurseClinicVisit from '../pages/ChronicCare/NurseClinicVisit';
import DoctorReview from '../pages/ChronicCare/DoctorReview';

// Follow-Up Pages
import ClinicCalendar from '../pages/FollowUp/ClinicCalendar';
import Defaulters from '../pages/FollowUp/Defaulters';

// Audit & Cashier Shift Pages
import AuditLogs from '../pages/Admin/AuditLogs';
import ShiftReports from '../pages/Admin/ShiftReports';
import ShiftManagement from '../pages/Cashier/ShiftManagement';

// Insurance/NHIF/SHA Pages
import InsuranceDashboard from '../pages/Insurance/InsuranceDashboard';
import ClaimsList from '../pages/Insurance/ClaimsList';
import EligibilityVerification from '../pages/Insurance/EligibilityVerification';

// Expenses Pages
import ExpensesManagement from '../pages/Admin/ExpensesManagement';

// Setup & Module Management Pages
import SetupWizard from '../pages/Setup/SetupWizard';
import ModuleManagement from '../pages/Admin/ModuleManagement';

// Radiology Pages
import RadiologyDashboard from '../pages/Radiology/RadiologyDashboard';
import RadiologistWorkstation from '../pages/Radiology/RadiologistWorkstation';
import DoctorRadiologyOrders from '../pages/doctor/DoctorRadiologyOrders';
import RadiologyExamsManagement from '../pages/Admin/RadiologyExamsManagement';

// Sync Dashboard
import SyncDashboard from '../pages/Admin/SyncDashboard';

// Super Admin Pages
import {
  SuperAdminDashboard,
  HospitalList,
  HospitalForm,
  HospitalModules
} from '../pages/SuperAdmin';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if sidebar should be shown (receptionist doesn't get sidebar)
  const showSidebar = user?.role !== 'receptionist' && user?.role !== 'reception';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        {showSidebar && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <main className={`flex-1 ${showSidebar ? 'lg:ml-0' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();
  const loginPath = getTenantAwareLoginPath();
  const defaultDashboardPath = user ? `/${user.role}/dashboard` : loginPath;

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to={defaultDashboardPath} replace /> : <Login />} />
      <Route path="/:hospital" element={user ? <Navigate to={defaultDashboardPath} replace /> : <Login />} />

      {/* Setup Wizard (Public - for initial hospital setup) */}
      <Route path="/setup" element={<SetupWizard />} />

      {/* Super Admin Routes */}
      <Route path="/superadmin/dashboard" element={
        <ProtectedRoute requiredRole={['superadmin']}>
          <DashboardLayout><SuperAdminDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/superadmin/hospitals" element={
        <ProtectedRoute requiredRole={['superadmin']}>
          <DashboardLayout><HospitalList /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/superadmin/hospitals/new" element={
        <ProtectedRoute requiredRole={['superadmin']}>
          <DashboardLayout><HospitalForm /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/superadmin/hospitals/:id" element={
        <ProtectedRoute requiredRole={['superadmin']}>
          <DashboardLayout><HospitalForm /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/superadmin/hospitals/:id/modules" element={
        <ProtectedRoute requiredRole={['superadmin']}>
          <DashboardLayout><HospitalModules /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Admin Routes (Supervisor can access admin pages) */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <DashboardLayout><AdminDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Module Management - Admin Only */}
      <Route path="/admin/modules" element={
        <ProtectedRoute requiredRole={['admin']}>
          <DashboardLayout><ModuleManagement /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Radiology Routes */}
      <Route path="/admin/radiology" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor', 'radiologist']}>
          <ModuleGuard moduleCode="radiology">
            <DashboardLayout><RadiologyDashboard /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/radiology/exams" element={
        <ProtectedRoute requiredRole={['admin']}>
          <ModuleGuard moduleCode="radiology">
            <DashboardLayout><RadiologyExamsManagement /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/radiologist/dashboard" element={
        <ProtectedRoute requiredRole={['radiologist']}>
          <DashboardLayout><RadiologistWorkstation /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/radiologist/pending" element={
        <ProtectedRoute requiredRole={['radiologist']}>
          <DashboardLayout><RadiologistWorkstation /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/radiologist/completed" element={
        <ProtectedRoute requiredRole={['radiologist']}>
          <DashboardLayout><RadiologistWorkstation /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/radiologist/external" element={
        <ProtectedRoute requiredRole={['radiologist']}>
          <DashboardLayout><RadiologistWorkstation /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Radiology Orders */}
      <Route path="/doctor/radiology" element={
        <ProtectedRoute requiredRole={['doctor']}>
          <DashboardLayout><DoctorRadiologyOrders /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Sync Dashboard */}
      <Route path="/admin/sync" element={
        <ProtectedRoute requiredRole={['admin']}>
          <DashboardLayout><SyncDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/attendance" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="attendance">
            <DashboardLayout><EmployeeAttendanceView /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <DashboardLayout><SystemSettings /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/reports" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <DashboardLayout><AdminReports /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin/inventory" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="inventory">
            <DashboardLayout><InventoryDashboard /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/inventory/dashboard" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="inventory">
            <DashboardLayout><InventoryDashboard /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/inventory/medicines" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="inventory">
            <DashboardLayout><MedicineList /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/inventory/equipment" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="inventory">
            <DashboardLayout><EquipmentList /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/inventory/add-medicine" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="inventory">
            <DashboardLayout><AddMedicine /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/inventory/add-equipment" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="inventory">
            <DashboardLayout><AddEquipment /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/inventory/direct-sales" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="inventory">
            <DashboardLayout><DirectSalesList /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/inventory/scanner" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="inventory">
            <DashboardLayout><BarcodeScannerView /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />

      <Route path="/admin/add-staff" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <DashboardLayout><AddStaff /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/tests-management" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="laboratory">
            <DashboardLayout><LabTestManagement /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />

      <Route path="/admin/ambulances" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="ambulance">
            <DashboardLayout><AmbulanceList /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/ambulance-requests" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="ambulance">
            <DashboardLayout><AmbulanceRequestList /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/billing" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="billing">
            <DashboardLayout><BillingPage /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />

      {/* Chronic Care Routes (Admin) */}
      <Route path="/admin/chronic/clinics" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="chronicCare">
            <DashboardLayout><ClinicManagement /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/chronic/calendar" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="chronicCare">
            <DashboardLayout><ClinicCalendar /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/chronic/defaulters" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="chronicCare">
            <DashboardLayout><Defaulters /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />

      {/* Audit & Shift Management Routes */}
      <Route path="/admin/audit" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="audit">
            <DashboardLayout><AuditLogs /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/shifts" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="billing">
            <DashboardLayout><ShiftReports /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />

      {/* Insurance/NHIF/SHA Routes */}
      <Route path="/admin/insurance" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="insurance">
            <DashboardLayout><InsuranceDashboard /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/insurance/claims" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="insurance">
            <DashboardLayout><ClaimsList /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/insurance/verify" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor', 'receptionist']}>
          <ModuleGuard moduleCode="insurance">
            <DashboardLayout><EligibilityVerification /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />

      {/* Expenses Management Routes */}
      <Route path="/admin/expenses" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="expenses">
            <DashboardLayout><ExpensesManagement /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/expenses/salaries" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="expenses">
            <DashboardLayout><ExpensesManagement /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/expenses/utilities" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="expenses">
            <DashboardLayout><ExpensesManagement /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />
      <Route path="/admin/expenses/supplies" element={
        <ProtectedRoute requiredRole={['admin', 'supervisor']}>
          <ModuleGuard moduleCode="expenses">
            <DashboardLayout><ExpensesManagement /></DashboardLayout>
          </ModuleGuard>
        </ProtectedRoute>
      } />

      {/* Supervisor Routes (same as admin) */}
      <Route path="/supervisor/dashboard" element={
        <ProtectedRoute requiredRole="supervisor">
          <Navigate to="/admin/dashboard" replace />
        </ProtectedRoute>
      } />



      {/* Nurse Routes (can access doctor pages for consultation) */}
      <Route path="/nurse/dashboard" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><NurseDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/nurse/vitals/:queueId" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><VitalsRecording /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/nurse/patients" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><PatientList /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/nurse/patients/:id" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><PatientDetails /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Nurse can do consultation when doctor is not available */}
      <Route path="/nurse/consultation/:queueId" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><ConsultationPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/nurse/prescriptions" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><DoctorsPrescription /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/nurse/lab-results" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><LabResults /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/nurse/register-patient" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><RegisterPatient /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Nurse Chronic Care Routes */}
      <Route path="/nurse/chronic/calendar" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><ClinicCalendar /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/nurse/chronic/visit/:enrollmentId" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><NurseClinicVisit /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/nurse/chronic/enroll/:patientId" element={
        <ProtectedRoute requiredRole="nurse">
          <DashboardLayout><EnrollPatient /></DashboardLayout>
        </ProtectedRoute>
      } />




      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><DoctorDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/patients" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><PatientList /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/prescriptions" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><DoctorsPrescription /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/prescriptions/:id" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><PrescriptionDetailsView /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/lab-results" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><LabResults /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/medicines" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><MedicineList /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/lab/orders/:id" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><LabOrderDetails /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/patient/:patientId/lab-history" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><PatientLabHistory /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/patients/:id" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><PatientDetails /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/consultation/:queueId" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><ConsultationPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/referral/create/:queueId" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><CreateReferral /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/doctor/referrals"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DashboardLayout><ReferralListPage /></DashboardLayout>
          </ProtectedRoute>
        } />

      <Route path="/doctor/referrals/:id"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DashboardLayout><ReferralDetailsPage /></DashboardLayout>
          </ProtectedRoute>
        } />

      <Route path="/doctor/ambulance-requests" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><AmbulanceRequestList /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/ambulance-request/new" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><OutgoingAmbulanceForm /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/ambulance-request/:queueId" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><OutgoingAmbulanceForm /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/register-patient" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><RegisterPatient /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Doctor Chronic Care Routes */}
      <Route path="/doctor/chronic/review" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><DoctorReview /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/chronic/calendar" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><ClinicCalendar /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/chronic/enroll/:patientId" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><EnrollPatient /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/chronic/defaulters" element={
        <ProtectedRoute requiredRole="doctor">
          <DashboardLayout><Defaulters /></DashboardLayout>
        </ProtectedRoute>
      } />






      {/* Reception Routes */}
      <Route path="/receptionist/dashboard" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><ReceptionDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/register" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><PatientRegistration /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/patients" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><PatientList /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/queue" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><QueueManagement /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/patients/:id" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><PatientDetails /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/reception/ambulance-requests" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><AmbulanceRequestList /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/incoming-ambulance" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><IncomingAmbulanceForm /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/reception/ambulance-request/new" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><OutgoingAmbulanceForm /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/billing" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><BillingPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/bill-receipt/:billId" element={
        <ProtectedRoute requiredRole="receptionist">
          <BillReceipt />
        </ProtectedRoute>
      } />

      <Route path="/reception/patient-bills/:patientId" element={
        <ProtectedRoute requiredRole="receptionist">
          <PatientBills />
        </ProtectedRoute>
      } />

      <Route path="/reception/patient-bills-receipt/:patientId" element={
        <ProtectedRoute requiredRole="receptionist">
          <PatientBillsReceipt />
        </ProtectedRoute>
      } />

      <Route path="/reception/tests" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><LabTestManagement /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/reception/shift" element={
        <ProtectedRoute requiredRole="receptionist">
          <DashboardLayout><ShiftManagement /></DashboardLayout>
        </ProtectedRoute>
      } />






      {/* Pharmacy Routes */}
      <Route path="/pharmacy/dashboard" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><PharmacyDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/medicines" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><MedicineList /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/patients" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><PatientList /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/patients/:id" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><PatientDetails /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/add-medicine" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><AddMedicine /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/scanner" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><BarcodeScannerView /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/prescriptions" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><PrescriptionList /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/prescriptions/:id" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><PrescriptionDetails /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/dispense/:queueId" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><DispensePrescription /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/direct-sale" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><DirectSale /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/direct-sales-list" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><DirectSalesList /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/dispensed" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><DispensedPrescriptions /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/receipt/:id" element={
        <ProtectedRoute requiredRole="pharmacy">
          <Receipt />
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/billing" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><BillingPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/pharmacy/bill-receipt/:billId" element={
        <ProtectedRoute requiredRole="pharmacy">
          <BillReceipt />
        </ProtectedRoute>
      } />
      <Route path="/pharmacy/register-patient" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><RegisterPatient /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/pharmacy/shift" element={
        <ProtectedRoute requiredRole="pharmacy">
          <DashboardLayout><ShiftManagement /></DashboardLayout>
        </ProtectedRoute>
      } />






      {/* Lab Routes */}
      <Route path="/lab/dashboard" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><LabDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/lab/patients" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><PatientList /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/lab/patients/:id" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><PatientDetails /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/lab/orders/:id" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><LabOrderDetails /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/lab/orders/:orderId/test/:testItemId" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><LabTestResultsEntry /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/lab/results" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><LabResults /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/lab/patient/:patientId/history" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><PatientLabHistory /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/patient/:orderId/lab-results/print" element={
        <ProtectedRoute requiredRole={['doctor', 'lab']}>
          <LabResultsPrint />
        </ProtectedRoute>
      } />



      <Route path="/lab/tests-management" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><LabTestManagement /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/lab/register-patient" element={
        <ProtectedRoute requiredRole="lab">
          <DashboardLayout><RegisterPatient /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Default Route */}
      <Route path="/" element={<Navigate to={defaultDashboardPath} replace />} />
      <Route path="*" element={<Navigate to={defaultDashboardPath} replace />} />
    </Routes>
  );
};

export default AppRoutes;
