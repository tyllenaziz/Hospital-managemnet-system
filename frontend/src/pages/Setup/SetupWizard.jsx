import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Settings,
    UserCog,
    ChevronRight,
    ChevronLeft,
    Check,
    Loader2,
    Upload,
    Stethoscope,
    TestTube,
    Pill,
    Receipt,
    Package,
    Users,
    Ambulance,
    ClipboardList,
    Activity,
    ScanLine,
    Shield,
    DollarSign,
    Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SetupWizard = () => {
    const navigate = useNavigate();
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Hospital Info State
    const [hospitalInfo, setHospitalInfo] = useState({
        hospital_name: '',
        hospital_code: '',
        address: '',
        city: '',
        county: '',
        country: 'Kenya',
        phone: '',
        email: '',
        license_number: '',
        consultation_fee: 500
    });

    // Modules State
    const [modules, setModules] = useState([]);
    const [selectedModules, setSelectedModules] = useState({});

    // Admin Account State
    const [adminAccount, setAdminAccount] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const steps = [
        { id: 1, name: 'Hospital Info', icon: Building2 },
        { id: 2, name: 'Select Modules', icon: Settings },
        { id: 3, name: 'Admin Account', icon: UserCog }
    ];

    const moduleIcons = {
        pharmacy: Pill,
        laboratory: TestTube,
        radiology: ScanLine,
        chronicCare: Activity,
        referrals: ClipboardList,
        followUp: Clock,
        billing: Receipt,
        insurance: Shield,
        expenses: DollarSign,
        mpesa: DollarSign,
        inventory: Package,
        attendance: Users,
        ambulance: Ambulance,
        audit: ClipboardList
    };

    useEffect(() => {
        checkSetupStatus();
    }, []);

    const checkSetupStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/setup/status`);
            const data = await response.json();

            if (data.setupCompleted) {
                navigate('/login');
                return;
            }

            setCurrentStep(data.setupStep + 1 || 1);
            await fetchModules();
        } catch (error) {
            console.error('Error checking setup status:', error);
        } finally {
            setCheckingStatus(false);
        }
    };

    const fetchModules = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/setup/modules`);
            const data = await response.json();

            if (data.success) {
                setModules(data.modules);
                const selected = {};
                data.modules.forEach(m => {
                    selected[m.module_code] = m.is_enabled;
                });
                setSelectedModules(selected);
            }
        } catch (error) {
            console.error('Error fetching modules:', error);
        }
    };

    const handleHospitalInfoChange = (e) => {
        const { name, value } = e.target;
        setHospitalInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleModuleToggle = (moduleCode, isRequired) => {
        if (isRequired) return;
        setSelectedModules(prev => ({
            ...prev,
            [moduleCode]: !prev[moduleCode]
        }));
    };

    const saveHospitalInfo = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/setup/hospital`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hospitalInfo)
            });

            if (response.ok) {
                setCurrentStep(2);
            }
        } catch (error) {
            console.error('Error saving hospital info:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveModules = async () => {
        setLoading(true);
        try {
            const modulesToUpdate = Object.entries(selectedModules).map(([code, enabled]) => ({
                module_code: code,
                is_enabled: enabled
            }));

            const response = await fetch(`${API_BASE_URL}/setup/modules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modules: modulesToUpdate })
            });

            if (response.ok) {
                setCurrentStep(3);
            }
        } catch (error) {
            console.error('Error saving modules:', error);
        } finally {
            setLoading(false);
        }
    };

    const completeSetup = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/setup/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error completing setup:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupedModules = {
        clinical: modules.filter(m => m.category === 'clinical'),
        financial: modules.filter(m => m.category === 'financial'),
        operations: modules.filter(m => m.category === 'operations')
    };

    if (checkingStatus) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Checking setup status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Stethoscope className="w-10 h-10 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Hospital Setup Wizard</h1>
                    </div>
                    <p className="text-gray-600">Configure your hospital management system</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                    {steps.map((step, index) => {
                        const StepIcon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <React.Fragment key={step.id}>
                                <div className={`flex flex-col items-center ${isActive ? 'scale-110' : ''} transition-transform`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 text-white' :
                                            isActive ? 'bg-blue-600 text-white shadow-lg' :
                                                'bg-gray-200 text-gray-500'
                                        }`}>
                                        {isCompleted ? <Check size={24} /> : <StepIcon size={24} />}
                                    </div>
                                    <span className={`mt-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                        {step.name}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-24 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Step 1: Hospital Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Hospital Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
                                    <input
                                        type="text"
                                        name="hospital_name"
                                        value={hospitalInfo.hospital_name}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter hospital name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Code</label>
                                    <input
                                        type="text"
                                        name="hospital_code"
                                        value={hospitalInfo.hospital_code}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., BMH-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                                    <input
                                        type="text"
                                        name="license_number"
                                        value={hospitalInfo.license_number}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="Medical license number"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={hospitalInfo.address}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="Street address"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City/Town</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={hospitalInfo.city}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="City"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
                                    <input
                                        type="text"
                                        name="county"
                                        value={hospitalInfo.county}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="County"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={hospitalInfo.phone}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="+254..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={hospitalInfo.email}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="hospital@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (KES)</label>
                                    <input
                                        type="number"
                                        name="consultation_fee"
                                        value={hospitalInfo.consultation_fee}
                                        onChange={handleHospitalInfoChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        placeholder="500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    onClick={saveHospitalInfo}
                                    disabled={loading || !hospitalInfo.hospital_name}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                    Next: Select Modules
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Modules */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Modules</h2>
                            <p className="text-gray-600 mb-6">Choose which modules to enable for your hospital</p>

                            {/* Clinical Modules */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Stethoscope size={20} className="text-blue-600" />
                                    Clinical Modules
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedModules.clinical.map(module => {
                                        const Icon = moduleIcons[module.module_code] || Settings;
                                        const isEnabled = selectedModules[module.module_code];
                                        return (
                                            <div
                                                key={module.module_code}
                                                onClick={() => handleModuleToggle(module.module_code, module.is_required)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isEnabled
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    } ${module.is_required ? 'opacity-75 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium text-gray-900">{module.module_name}</h4>
                                                            {module.is_required && (
                                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Required</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isEnabled ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                                        }`}>
                                                        {isEnabled && <Check size={14} className="text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Financial Modules */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <DollarSign size={20} className="text-green-600" />
                                    Financial Modules
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedModules.financial.map(module => {
                                        const Icon = moduleIcons[module.module_code] || Settings;
                                        const isEnabled = selectedModules[module.module_code];
                                        return (
                                            <div
                                                key={module.module_code}
                                                onClick={() => handleModuleToggle(module.module_code, module.is_required)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isEnabled
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    } ${module.is_required ? 'opacity-75 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium text-gray-900">{module.module_name}</h4>
                                                            {module.is_required && (
                                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Required</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isEnabled ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                                        }`}>
                                                        {isEnabled && <Check size={14} className="text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Operations Modules */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Settings size={20} className="text-purple-600" />
                                    Operations Modules
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedModules.operations.map(module => {
                                        const Icon = moduleIcons[module.module_code] || Settings;
                                        const isEnabled = selectedModules[module.module_code];
                                        return (
                                            <div
                                                key={module.module_code}
                                                onClick={() => handleModuleToggle(module.module_code, module.is_required)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isEnabled
                                                        ? 'border-purple-500 bg-purple-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    } ${module.is_required ? 'opacity-75 cursor-not-allowed' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium text-gray-900">{module.module_name}</h4>
                                                            {module.is_required && (
                                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Required</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isEnabled ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                                                        }`}>
                                                        {isEnabled && <Check size={14} className="text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between pt-6">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={saveModules}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                    Next: Complete Setup
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Complete Setup */}
                    {currentStep === 3 && (
                        <div className="space-y-6 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-10 h-10 text-green-600" />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900">Setup Complete!</h2>
                            <p className="text-gray-600 max-w-md mx-auto">
                                Your hospital management system is configured and ready to use.
                                Click the button below to complete setup and start using the system.
                            </p>

                            <div className="bg-gray-50 rounded-xl p-6 text-left max-w-md mx-auto">
                                <h3 className="font-medium text-gray-900 mb-3">Summary:</h3>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li>✓ Hospital information saved</li>
                                    <li>✓ {Object.values(selectedModules).filter(Boolean).length} modules enabled</li>
                                    <li>✓ System ready for use</li>
                                </ul>
                            </div>

                            <div className="flex justify-center gap-4 pt-6">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                    Back
                                </button>
                                <button
                                    onClick={completeSetup}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check size={20} />}
                                    Complete Setup & Login
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
