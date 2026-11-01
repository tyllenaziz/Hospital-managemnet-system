import React, { useState, useEffect } from 'react';
import {
    Settings,
    Check,
    X,
    Loader2,
    AlertTriangle,
    RefreshCw,
    Stethoscope,
    DollarSign,
    Package,
    Info,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ModuleManagement = () => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [notification, setNotification] = useState(null);

    const categoryIcons = {
        clinical: Stethoscope,
        financial: DollarSign,
        operations: Package,
        core: Settings
    };

    const categoryColors = {
        clinical: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-800' },
        financial: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', badge: 'bg-green-100 text-green-800' },
        operations: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' },
        core: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-600', badge: 'bg-gray-100 text-gray-800' }
    };

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/setup/modules`);
            const data = await response.json();

            if (data.success) {
                setModules(data.modules);
            }
        } catch (error) {
            console.error('Error fetching modules:', error);
            showNotification('Failed to fetch modules', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = async (moduleCode, currentStatus) => {
        setSaving(prev => ({ ...prev, [moduleCode]: true }));
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/setup/modules/${moduleCode}/toggle`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !currentStatus })
            });

            const data = await response.json();

            if (data.success) {
                setModules(prev => prev.map(m =>
                    m.module_code === moduleCode
                        ? { ...m, is_enabled: !currentStatus }
                        : m
                ));
                showNotification(`${data.module.module_name} ${!currentStatus ? 'enabled' : 'disabled'}`, 'success');
            } else {
                showNotification(data.error || 'Failed to toggle module', 'error');
            }
        } catch (error) {
            console.error('Error toggling module:', error);
            showNotification('Failed to update module', 'error');
        } finally {
            setSaving(prev => ({ ...prev, [moduleCode]: false }));
        }
    };

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const groupedModules = modules.reduce((acc, module) => {
        if (!acc[module.category]) {
            acc[module.category] = [];
        }
        acc[module.category].push(module);
        return acc;
    }, {});

    const enabledCount = modules.filter(m => m.is_enabled).length;
    const totalCount = modules.length;

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading modules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {notification.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Module Management</h1>
                    <p className="text-gray-500 mt-1">Enable or disable hospital system modules</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-blue-50 rounded-lg">
                        <span className="text-blue-600 font-semibold">{enabledCount}/{totalCount}</span>
                        <span className="text-blue-500 ml-1">modules enabled</span>
                    </div>
                    <button
                        onClick={fetchModules}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                    <h3 className="font-medium text-amber-800">Restart Required</h3>
                    <p className="text-amber-700 text-sm mt-1">
                        After enabling or disabling modules, restart the application for changes to take full effect.
                    </p>
                </div>
            </div>

            {/* Module Categories */}
            {['core', 'clinical', 'financial', 'operations'].map(category => {
                const categoryModules = groupedModules[category] || [];
                if (categoryModules.length === 0) return null;

                const CategoryIcon = categoryIcons[category];
                const colors = categoryColors[category];

                return (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colors.bg}`}>
                                <CategoryIcon className={colors.icon} size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800 capitalize">{category} Modules</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                                {categoryModules.filter(m => m.is_enabled).length}/{categoryModules.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryModules.map(module => (
                                <div
                                    key={module.module_code}
                                    className={`bg-white rounded-xl border ${colors.border} p-5 transition-all hover:shadow-md ${module.is_required ? 'opacity-80' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{module.module_name}</h3>
                                                {module.is_required && (
                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Required</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{module.description}</p>
                                        </div>

                                        <button
                                            onClick={() => toggleModule(module.module_code, module.is_enabled)}
                                            disabled={module.is_required || saving[module.module_code]}
                                            className={`shrink-0 ml-3 transition-colors ${module.is_required ? 'cursor-not-allowed' : 'cursor-pointer'
                                                }`}
                                        >
                                            {saving[module.module_code] ? (
                                                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                            ) : module.is_enabled ? (
                                                <ToggleRight className="w-10 h-10 text-green-500" />
                                            ) : (
                                                <ToggleLeft className="w-10 h-10 text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={`font-medium ${module.is_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                                                {module.is_enabled ? '● Enabled' : '○ Disabled'}
                                            </span>
                                            <span className="text-gray-400 text-xs">{module.module_code}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ModuleManagement;
