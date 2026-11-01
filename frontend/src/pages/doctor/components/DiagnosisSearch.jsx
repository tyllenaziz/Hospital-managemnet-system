import { useState, useEffect, useCallback } from 'react';
import { Search, X, Star, Plus } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { debounce } from '../../../utils/debounce';

const DiagnosisSearch = ({
    selectedDiagnoses = [],
    onDiagnosesChange,
    disabled = false
}) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [commonDiagnoses, setCommonDiagnoses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customDiagnosis, setCustomDiagnosis] = useState('');

    // Fetch common diagnoses on mount
    useEffect(() => {
        fetchCommonDiagnoses();
    }, []);

    const fetchCommonDiagnoses = async () => {
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/diagnoses/common?limit=30`);
            const data = await response.json();
            if (data.success) {
                setCommonDiagnoses(data.diagnoses);
            }
        } catch (error) {
            console.error('Error fetching common diagnoses:', error);
        }
    };

    // Debounced search function
    const searchDiagnoses = useCallback(
        debounce(async (query) => {
            if (query.length < 2) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                const response = await authenticatedFetch(
                    `${API_BASE_URL}/diagnoses/search?q=${encodeURIComponent(query)}&limit=20`
                );
                const data = await response.json();
                if (data.success) {
                    // Filter out already selected diagnoses
                    const filtered = data.diagnoses.filter(
                        d => !selectedDiagnoses.some(s => s.diagnosis_code_id === d.id)
                    );
                    setSearchResults(filtered);
                }
            } catch (error) {
                console.error('Error searching diagnoses:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [authenticatedFetch, API_BASE_URL, selectedDiagnoses]
    );

    useEffect(() => {
        if (searchQuery) {
            searchDiagnoses(searchQuery);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, searchDiagnoses]);

    const handleSelectDiagnosis = (diagnosis) => {
        const newDiagnosis = {
            diagnosis_code_id: diagnosis.id,
            code: diagnosis.code,
            description: diagnosis.description,
            category: diagnosis.category,
            is_primary: selectedDiagnoses.length === 0, // First one is primary by default
            custom_diagnosis: null
        };

        onDiagnosesChange([...selectedDiagnoses, newDiagnosis]);
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    const handleAddCustomDiagnosis = () => {
        if (!customDiagnosis.trim()) return;

        const newDiagnosis = {
            diagnosis_code_id: null,
            code: 'CUSTOM',
            description: customDiagnosis.trim(),
            category: 'Custom',
            is_primary: selectedDiagnoses.length === 0,
            custom_diagnosis: customDiagnosis.trim()
        };

        onDiagnosesChange([...selectedDiagnoses, newDiagnosis]);
        setCustomDiagnosis('');
        setShowCustomInput(false);
    };

    const handleRemoveDiagnosis = (index) => {
        const wasPromary = selectedDiagnoses[index].is_primary;
        const updated = selectedDiagnoses.filter((_, i) => i !== index);

        // If we removed the primary and there are others, make first one primary
        if (wasPromary && updated.length > 0) {
            updated[0].is_primary = true;
        }

        onDiagnosesChange(updated);
    };

    const handleSetPrimary = (index) => {
        const updated = selectedDiagnoses.map((d, i) => ({
            ...d,
            is_primary: i === index
        }));
        onDiagnosesChange(updated);
    };

    const displayResults = searchQuery.length >= 2 ? searchResults : commonDiagnoses;

    return (
        <div className="space-y-3">
            {/* Selected Diagnoses Tags */}
            {selectedDiagnoses.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedDiagnoses.map((diag, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${diag.is_primary
                                    ? 'bg-teal-50 border-teal-300 text-teal-800'
                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => handleSetPrimary(index)}
                                className={`flex-shrink-0 ${diag.is_primary
                                        ? 'text-teal-600'
                                        : 'text-gray-400 hover:text-yellow-500'
                                    }`}
                                title={diag.is_primary ? 'Primary diagnosis' : 'Set as primary'}
                                disabled={disabled}
                            >
                                <Star size={14} fill={diag.is_primary ? 'currentColor' : 'none'} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-xs">{diag.code}</span>
                                <span className="mx-1 text-gray-400">-</span>
                                <span className="text-sm truncate">{diag.description}</span>
                            </div>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveDiagnosis(index)}
                                    className="flex-shrink-0 text-gray-400 hover:text-red-500"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search diagnosis by code or description..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        disabled={disabled}
                    />
                    {loading && (
                        <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>
                        </div>
                    )}
                </div>

                {/* Dropdown Results */}
                {showDropdown && displayResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {searchQuery.length < 2 && (
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                                Common Diagnoses
                            </div>
                        )}
                        {displayResults.map((diag) => (
                            <button
                                key={diag.id}
                                type="button"
                                onClick={() => handleSelectDiagnosis(diag)}
                                className="w-full px-4 py-3 text-left hover:bg-teal-50 transition flex items-start gap-3 border-b border-gray-100 last:border-0"
                            >
                                <span className="font-mono text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded flex-shrink-0">
                                    {diag.code}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 line-clamp-2">{diag.description}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{diag.category}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* No results message */}
                {showDropdown && searchQuery.length >= 2 && !loading && searchResults.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">No matching diagnoses found</p>
                        <button
                            type="button"
                            onClick={() => {
                                setShowCustomInput(true);
                                setCustomDiagnosis(searchQuery);
                                setShowDropdown(false);
                            }}
                            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                            + Add as custom diagnosis
                        </button>
                    </div>
                )}
            </div>

            {/* Close dropdown on click outside */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowDropdown(false)}
                />
            )}

            {/* Custom Diagnosis Input */}
            {showCustomInput && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customDiagnosis}
                        onChange={(e) => setCustomDiagnosis(e.target.value)}
                        placeholder="Enter custom diagnosis..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={handleAddCustomDiagnosis}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                        Add
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowCustomInput(false);
                            setCustomDiagnosis('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Add Custom Button */}
            {!showCustomInput && !disabled && (
                <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-teal-600"
                >
                    <Plus size={16} />
                    Add custom diagnosis
                </button>
            )}
        </div>
    );
};

export default DiagnosisSearch;
