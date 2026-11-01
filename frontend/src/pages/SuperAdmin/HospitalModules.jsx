import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Package, ArrowLeft, Check, X,
    AlertCircle, Settings, Shield
} from 'lucide-react';

const HospitalModules = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authenticatedFetch, API_BASE_URL } = useAuth();

    const [hospital, setHospital] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            // Fetch hospital info
            const hospitalRes = await authenticatedFetch(`${API_BASE_URL}/superadmin/hospitals/${id}`);
            const hospitalData = await hospitalRes.json();
            if (hospitalData.success) {
                setHospital(hospitalData.hospital);
            }

            // Fetch modules
            const modulesRes = await authenticatedFetch(`${API_BASE_URL}/superadmin/hospitals/${id}/modules`);
            const modulesData = await modulesRes.json();
            if (modulesData.success) {
                setModules(modulesData.modules);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = async (moduleCode, currentStatus) => {
        setToggling(moduleCode);
        try {
            const res = await authenticatedFetch(
                `${API_BASE_URL}/superadmin/hospitals/${id}/modules/${moduleCode}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ enabled: !currentStatus })
                }
            );
            const data = await res.json();
            if (data.success) {
                setModules(prev => prev.map(m =>
                    m.code === moduleCode ? { ...m, is_enabled: !currentStatus } : m
                ));
            }
        } catch (error) {
            console.error('Toggle module error:', error);
        } finally {
            setToggling(null);
        }
    };

    const categoryColors = {
        'core': 'from-blue-500 to-indigo-600',
        'clinical': 'from-green-500 to-emerald-600',
        'administrative': 'from-amber-500 to-orange-600',
        'specialty': 'from-purple-500 to-pink-600',
        'support': 'from-slate-500 to-gray-600'
    };

    const groupByCategory = (modules) => {
        return modules.reduce((acc, module) => {
            const category = module.category || 'other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(module);
            return acc;
        }, {});
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const groupedModules = groupByCategory(modules);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-800">Module Management</h1>
                    <p className="text-gray-500 mt-1">
                        Configure enabled modules for <span className="font-medium">{hospital?.name}</span>
                    </p>
                </div>
                <Link
                    to={`/superadmin/hospitals/${id}`}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                >
                    Back to Hospital
                </Link>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                <div>
                    <p className="text-blue-800 font-medium">Module Subscription Control</p>
                    <p className="text-blue-600 text-sm">
                        Enable or disable modules for this hospital. Required modules cannot be disabled.
                        Hospital admins cannot modify these settings.
                    </p>
                </div>
            </div>

            {/* Module Categories */}
            <div className="space-y-8">
                {Object.entries(groupedModules).map(([category, categoryModules]) => (
                    <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className={`bg-gradient-to-r ${categoryColors[category] || categoryColors.support} p-4`}>
                            <h2 className="text-lg font-semibold text-white capitalize flex items-center gap-2">
                                <Package size={20} />
                                {category} Modules
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {categoryModules.map(module => (
                                <div
                                    key={module.code}
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-800">{module.name}</h3>
                                            {module.required && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    <Shield size={10} />
                                                    Required
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-sm mt-1">{module.description}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {module.is_enabled && module.enabled_at && (
                                            <span className="text-gray-400 text-xs">
                                                Enabled {new Date(module.enabled_at).toLocaleDateString()}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => toggleModule(module.code, module.is_enabled)}
                                            disabled={module.required || toggling === module.code}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${module.is_enabled
                                                    ? 'bg-green-500'
                                                    : 'bg-gray-300'
                                                }
                        ${module.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${module.is_enabled ? 'translate-x-6' : 'translate-x-1'}
                        `}
                                            />
                                            {toggling === module.code && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="mt-8 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-gray-600">
                            <span className="font-medium text-gray-800">
                                {modules.filter(m => m.is_enabled).length}
                            </span> of <span className="font-medium text-gray-800">{modules.length}</span> modules enabled
                        </p>
                    </div>
                    <Link
                        to={`/superadmin/hospitals/${id}`}
                        className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                        Manage Hospital →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HospitalModules;
