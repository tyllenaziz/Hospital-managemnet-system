import { useState, useEffect, useCallback } from 'react';
import { X, Search, Plus, Star, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

// Debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const DiagnosisModal = ({ isOpen, onClose, selectedDiagnoses, onSave }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [localDiagnoses, setLocalDiagnoses] = useState(selectedDiagnoses || []);
    const [loading, setLoading] = useState(false);
    const [showCommon, setShowCommon] = useState(true);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Common diagnoses for quick selection
    const commonDiagnoses = [
        { code: 'J06.9', description: 'Acute upper respiratory infection', category: 'Respiratory' },
        { code: 'A09', description: 'Infectious gastroenteritis and colitis', category: 'Infectious' },
        { code: 'J18.9', description: 'Pneumonia, unspecified organism', category: 'Respiratory' },
        { code: 'B54', description: 'Unspecified malaria', category: 'Parasitic' },
        { code: 'A01.0', description: 'Typhoid fever', category: 'Infectious' },
        { code: 'I10', description: 'Essential (primary) hypertension', category: 'Cardiovascular' },
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine' },
        { code: 'K29.7', description: 'Gastritis, unspecified', category: 'Digestive' }
    ];

    useEffect(() => {
        setLocalDiagnoses(selectedDiagnoses || []);
    }, [selectedDiagnoses, isOpen]);

    // Search for diagnoses
    useEffect(() => {
        if (debouncedSearch.length >= 2) {
            searchDiagnoses(debouncedSearch);
            setShowCommon(false);
        } else {
            setSearchResults([]);
            setShowCommon(true);
        }
    }, [debouncedSearch]);

    const searchDiagnoses = async (query) => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(
                `${API_BASE_URL}/diagnoses/search?q=${encodeURIComponent(query)}`
            );
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.diagnoses || []);
            }
        } catch (err) {
            console.error('Error searching diagnoses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDiagnosis = (diagnosis) => {
        const alreadyAdded = localDiagnoses.some(d => d.code === diagnosis.code);
        if (alreadyAdded) return;

        const newDiagnosis = {
            diagnosis_code_id: diagnosis.id || null,
            code: diagnosis.code,
            description: diagnosis.description,
            category: diagnosis.category,
            is_primary: localDiagnoses.length === 0 // First one is primary
        };

        setLocalDiagnoses(prev => [...prev, newDiagnosis]);
        setSearchQuery('');
        setSearchResults([]);
        setShowCommon(true);
    };

    const handleRemoveDiagnosis = (code) => {
        setLocalDiagnoses(prev => {
            const updated = prev.filter(d => d.code !== code);
            // If removed was primary and there are others, make first one primary
            if (updated.length > 0 && !updated.some(d => d.is_primary)) {
                updated[0].is_primary = true;
            }
            return updated;
        });
    };

    const handleSetPrimary = (code) => {
        setLocalDiagnoses(prev =>
            prev.map(d => ({ ...d, is_primary: d.code === code }))
        );
    };

    const handleSave = () => {
        onSave(localDiagnoses);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-teal-600 p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Diagnosis Selection</h2>
                        <p className="text-teal-100 text-sm">Search ICD-10 codes or select common diagnoses</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by diagnosis name or ICD-10 code..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Search Results */}
                    {loading && (
                        <div className="text-center py-4 text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
                        </div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                            {searchResults.map(d => {
                                const isAdded = localDiagnoses.some(ld => ld.code === d.code);
                                return (
                                    <button
                                        key={d.id || d.code}
                                        onClick={() => !isAdded && handleAddDiagnosis(d)}
                                        disabled={isAdded}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition ${isAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-mono text-teal-600 font-medium">{d.code}</span>
                                                <span className="mx-2 text-gray-400">-</span>
                                                <span className="text-gray-800">{d.description}</span>
                                            </div>
                                            {isAdded ? (
                                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                            ) : (
                                                <Plus size={16} className="text-gray-400 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{d.category}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Common Diagnoses */}
                    {showCommon && !loading && (
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">Common Diagnoses</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {commonDiagnoses.map(d => {
                                    const isAdded = localDiagnoses.some(ld => ld.code === d.code);
                                    return (
                                        <button
                                            key={d.code}
                                            onClick={() => !isAdded && handleAddDiagnosis(d)}
                                            disabled={isAdded}
                                            className={`p-3 border rounded-lg text-left transition ${isAdded
                                                ? 'border-green-300 bg-green-50 opacity-60'
                                                : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50'
                                                }`}
                                        >
                                            <span className="font-mono text-teal-600 text-sm">{d.code}</span>
                                            <p className="text-gray-800 text-sm mt-1 line-clamp-1">{d.description}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selected Diagnoses */}
                    {localDiagnoses.length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-600 mb-2">
                                Selected Diagnoses ({localDiagnoses.length})
                            </p>
                            <div className="space-y-2">
                                {localDiagnoses.map(d => (
                                    <div
                                        key={d.code}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${d.is_primary
                                            ? 'border-teal-400 bg-teal-50'
                                            : 'border-gray-200 bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-indigo-600 font-medium">{d.code}</span>
                                                {d.is_primary && (
                                                    <span className="px-2 py-0.5 bg-teal-600 text-white text-xs rounded-full">
                                                        PRIMARY
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-800 text-sm">{d.description}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!d.is_primary && (
                                                <button
                                                    onClick={() => handleSetPrimary(d.code)}
                                                    className="p-2 hover:bg-yellow-100 rounded-lg transition text-gray-400 hover:text-yellow-600"
                                                    title="Set as primary"
                                                >
                                                    <Star size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemoveDiagnosis(d.code)}
                                                className="p-2 hover:bg-red-100 rounded-lg transition text-gray-400 hover:text-red-600"
                                                title="Remove"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {localDiagnoses.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                            <AlertCircle size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No diagnoses selected yet</p>
                            <p className="text-xs">Search or click a common diagnosis to add</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} />
                        Save Diagnoses ({localDiagnoses.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DiagnosisModal;
