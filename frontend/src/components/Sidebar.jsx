import { Link, useLocation } from 'react-router-dom';
import {
  X, Activity, Users, Calendar, Package, FileText, UserPlus, Scan, UserCheck,
  Clock, AlertTriangle, UserX, FlaskConical, Send, Car, ReceiptText, Stethoscope, Settings, HeartPulse, BarChart3, Shield, Wallet, Zap, Briefcase, ScanLine, Layers, Cloud, Building2, GitBranch
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, hasModule } = useAuth();
  const location = useLocation();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [ambulanceOpen, setAmbulanceOpen] = useState(false);
  const [chronicOpen, setChronicOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [radiologyOpen, setRadiologyOpen] = useState(false);

  // Hide sidebar for receptionist role
  if (user?.role === 'receptionist' || user?.role === 'reception') {
    return null;
  }

  const menuItems = {
    superadmin: [
      { icon: Activity, label: 'Dashboard', path: '/superadmin/dashboard' },
      { icon: Building2, label: 'Hospitals', path: '/superadmin/hospitals' },
      { icon: Layers, label: 'Module Management', path: '/admin/modules' },
    ],
    admin: [
      { icon: Activity, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Calendar, label: 'Attendance', path: '/admin/attendance', module: 'attendance' },
      {
        icon: Package,
        label: 'Inventory',
        path: '/admin/inventory',
        module: 'inventory',
        children: [
          { icon: Activity, label: 'Dashboard', path: '/admin/inventory/dashboard' },
          { icon: FileText, label: 'Medicines', path: '/admin/inventory/medicines' },
          { icon: Users, label: 'Equipment', path: '/admin/inventory/equipment' },
          { icon: Scan, label: 'Direct Sales', path: '/admin/inventory/direct-sales' }
        ]
      },
      {
        icon: Car,
        label: 'Ambulance',
        path: '/admin/ambulance',
        module: 'ambulance',
        children: [
          { icon: Car, label: 'Ambulance Fleet', path: '/admin/ambulances' },
          { icon: FileText, label: 'Ambulance Requests', path: '/admin/ambulance-requests' }
        ]
      },
      {
        icon: HeartPulse,
        label: 'Chronic Care',
        path: '/admin/chronic',
        module: 'chronicCare',
        children: [
          { icon: Activity, label: 'Clinics', path: '/admin/chronic/clinics' },
          { icon: Calendar, label: 'Calendar', path: '/admin/chronic/calendar' },
          { icon: AlertTriangle, label: 'Defaulters', path: '/admin/chronic/defaulters' }
        ]
      },
      {
        icon: Shield,
        label: 'Insurance/NHIF',
        path: '/admin/insurance',
        module: 'insurance',
        children: [
          { icon: Activity, label: 'Dashboard', path: '/admin/insurance' },
          { icon: FileText, label: 'Claims', path: '/admin/insurance/claims' },
          { icon: UserCheck, label: 'Verify Eligibility', path: '/admin/insurance/verify' }
        ]
      },
      { icon: ReceiptText, label: 'Billing', path: '/admin/billing', module: 'billing' },
      {
        icon: Wallet,
        label: 'Expenses',
        path: '/admin/expenses',
        module: 'expenses',
        children: [
          { icon: Activity, label: 'All Expenses', path: '/admin/expenses' },
          { icon: Briefcase, label: 'Salaries', path: '/admin/expenses/salaries' },
          { icon: Zap, label: 'Utilities', path: '/admin/expenses/utilities' },
          { icon: Package, label: 'Supplies', path: '/admin/expenses/supplies' }
        ]
      },
      { icon: FlaskConical, label: 'Test Management', path: '/admin/tests-management', module: 'laboratory' },
      {
        icon: ScanLine,
        label: 'Radiology',
        path: '/admin/radiology',
        module: 'radiology',
        children: [
          { icon: Activity, label: 'All Orders', path: '/admin/radiology' },
          { icon: Settings, label: 'Manage Exams', path: '/admin/radiology/exams' }
        ]
      },
      { icon: UserPlus, label: 'Add Staff', path: '/admin/add-staff' },
      { icon: FileText, label: 'Audit Trail', path: '/admin/audit', module: 'audit' },
      { icon: Clock, label: 'Shift Reports', path: '/admin/shifts', module: 'billing' },
      { icon: BarChart3, label: 'View Reports', path: '/admin/reports' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ],
    supervisor: [
      { icon: Activity, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: Calendar, label: 'Attendance', path: '/admin/attendance' },
      {
        icon: Package,
        label: 'Inventory',
        path: '/admin/inventory',
        children: [
          { icon: Activity, label: 'Dashboard', path: '/admin/inventory/dashboard' },
          { icon: FileText, label: 'Medicines', path: '/admin/inventory/medicines' },
          { icon: Users, label: 'Equipment', path: '/admin/inventory/equipment' },
          { icon: Scan, label: 'Direct Sales', path: '/admin/inventory/direct-sales' }
        ]
      },
      {
        icon: Car,
        label: 'Ambulance',
        path: '/admin/ambulance',
        children: [
          { icon: Car, label: 'Ambulance Fleet', path: '/admin/ambulances' },
          { icon: FileText, label: 'Ambulance Requests', path: '/admin/ambulance-requests' }
        ]
      },
      {
        icon: HeartPulse,
        label: 'Chronic Care',
        path: '/admin/chronic',
        children: [
          { icon: Activity, label: 'Clinics', path: '/admin/chronic/clinics' },
          { icon: Calendar, label: 'Calendar', path: '/admin/chronic/calendar' },
          { icon: AlertTriangle, label: 'Defaulters', path: '/admin/chronic/defaulters' }
        ]
      },
      {
        icon: Shield,
        label: 'Insurance/NHIF',
        path: '/admin/insurance',
        children: [
          { icon: Activity, label: 'Dashboard', path: '/admin/insurance' },
          { icon: FileText, label: 'Claims', path: '/admin/insurance/claims' },
          { icon: UserCheck, label: 'Verify Eligibility', path: '/admin/insurance/verify' }
        ]
      },
      { icon: ReceiptText, label: 'Billing', path: '/admin/billing' },
      { icon: FlaskConical, label: 'Test Management', path: '/admin/tests-management' },
      { icon: UserPlus, label: 'Add Staff', path: '/admin/add-staff' },
      { icon: FileText, label: 'Audit Trail', path: '/admin/audit' },
      { icon: Clock, label: 'Shift Reports', path: '/admin/shifts' },
      { icon: BarChart3, label: 'View Reports', path: '/admin/reports' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ],
    nurse: [
      { icon: Activity, label: 'Dashboard', path: '/nurse/dashboard' },
      { icon: UserPlus, label: 'Register Patient', path: '/nurse/register-patient' },
      { icon: Users, label: 'Patients', path: '/nurse/patients' },
      { icon: Stethoscope, label: 'Prescriptions', path: '/nurse/prescriptions' },
      { icon: FlaskConical, label: 'Lab Results', path: '/nurse/lab-results' },
      { icon: HeartPulse, label: 'Chronic Calendar', path: '/nurse/chronic/calendar' }
    ],
    doctor: [
      { icon: Activity, label: 'Dashboard', path: '/doctor/dashboard' },
      { icon: UserPlus, label: 'Register Patient', path: '/doctor/register-patient' },
      { icon: Users, label: 'Patients', path: '/doctor/patients' },
      { icon: FlaskConical, label: 'Lab Results', path: '/doctor/lab-results', module: 'laboratory' },
      { icon: FileText, label: 'Prescriptions', path: '/doctor/prescriptions', module: 'pharmacy' },
      { icon: ScanLine, label: 'Radiology Orders', path: '/doctor/radiology', module: 'radiology' },
      { icon: Package, label: 'Medicines', path: '/doctor/medicines', module: 'pharmacy' },
      { icon: Send, label: 'Referrals', path: '/doctor/referrals', module: 'referrals' },
      { icon: Car, label: 'Ambulance Requests', path: '/doctor/ambulance-requests', module: 'ambulance' },
      { icon: HeartPulse, label: 'Chronic Review', path: '/doctor/chronic/review', module: 'chronicCare' },
      { icon: AlertTriangle, label: 'Defaulters', path: '/doctor/chronic/defaulters', module: 'chronicCare' }
    ],
    radiologist: [
      { icon: Activity, label: 'Dashboard', path: '/radiologist/dashboard' },
      { icon: ScanLine, label: 'Pending Orders', path: '/radiologist/pending' },
      { icon: FileText, label: 'Completed Results', path: '/radiologist/completed' },
      { icon: Users, label: 'External Patients', path: '/radiologist/external' }
    ],
    pharmacy: [
      { icon: Activity, label: 'Dashboard', path: '/pharmacy/dashboard' },
      { icon: UserPlus, label: 'Register Patient', path: '/pharmacy/register-patient' },
      { icon: Package, label: 'Medicine Inventory', path: '/pharmacy/medicines', module: 'pharmacy' },
      { icon: Scan, label: 'Direct Sales', path: '/pharmacy/direct-sale', module: 'pharmacy' },
      { icon: FileText, label: 'Direct Sales List', path: '/pharmacy/direct-sales-list', module: 'pharmacy' },
      { icon: FileText, label: 'Dispensed Prescriptions', path: '/pharmacy/dispensed', module: 'pharmacy' },
      { icon: ReceiptText, label: 'Billing List', path: '/pharmacy/billing', module: 'billing' },
      { icon: Clock, label: 'My Shift', path: '/pharmacy/shift', module: 'billing' }
    ],
    lab: [
      { icon: Activity, label: 'Dashboard', path: '/lab/dashboard' },
      { icon: UserPlus, label: 'Register Patient', path: '/lab/register-patient' },
      { icon: FlaskConical, label: 'Test Management', path: '/lab/tests-management', module: 'laboratory' },
      { icon: FileText, label: 'Test Results', path: '/lab/results', module: 'laboratory' },
      { icon: Users, label: 'Patients', path: '/lab/patients' }
    ]
  };

  const items = (menuItems[user?.role] || []).filter(item => !item.module || hasModule(item.module));

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 h-screen overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>

        {/* Mobile Close Button */}
        <div className="p-4 flex justify-between items-center lg:hidden border-b border-gray-200 sticky top-0 bg-white z-10">
          <span className="text-gray-800 font-semibold">Menu</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            const hasChildren = item.children && item.children.length > 0;
            const isInventory = item.label === 'Inventory';
            const isAmbulance = item.label === 'Ambulance';
            const isChronic = item.label === 'Chronic Care';
            const isInsurance = item.label === 'Insurance/NHIF';
            const isExpenses = item.label === 'Expenses';
            const isRadiology = item.label === 'Radiology';

            const getIsOpen = () => {
              if (isInventory) return inventoryOpen;
              if (isAmbulance) return ambulanceOpen;
              if (isChronic) return chronicOpen;
              if (isInsurance) return insuranceOpen;
              if (isExpenses) return expensesOpen;
              if (isRadiology) return radiologyOpen;
              return false;
            };

            const toggleOpen = () => {
              if (isInventory) setInventoryOpen(!inventoryOpen);
              if (isAmbulance) setAmbulanceOpen(!ambulanceOpen);
              if (isChronic) setChronicOpen(!chronicOpen);
              if (isInsurance) setInsuranceOpen(!insuranceOpen);
              if (isExpenses) setExpensesOpen(!expensesOpen);
              if (isRadiology) setRadiologyOpen(!radiologyOpen);
            };

            return (
              <div key={index}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={toggleOpen}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-gray-900 border border-transparent hover:border-blue-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={20} className="flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${getIsOpen() ? 'rotate-180' : ''
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {getIsOpen() && (
                      <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                        {item.children.map((child, childIndex) => {
                          const ChildIcon = child.icon;
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={childIndex}
                              to={child.path}
                              onClick={onClose}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isChildActive
                                ? 'bg-blue-100 text-blue-700 border border-blue-200 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                              <ChildIcon size={18} className="flex-shrink-0" />
                              <span className="font-medium text-sm">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-gray-900 border border-transparent hover:border-blue-200'
                      }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
