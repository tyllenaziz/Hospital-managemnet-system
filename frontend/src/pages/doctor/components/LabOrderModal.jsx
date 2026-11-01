import { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, CheckCircle, FlaskConical, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const LabOrderModal = ({ isOpen, onClose, selectedTests, onSave }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [localTests, setLocalTests] = useState(selectedTests || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLocalTests(selectedTests || []);
    }, [selectedTests, isOpen]);

    // Fetch lab tests from API when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchLabTests();
        }
    }, [isOpen]);

    const fetchLabTests = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/lab/tests`);
            const data = await response.json();

            // Normalize the response - backend may return array directly or wrapped in {success, tests}
            let testsArray = [];
            if (data.success && Array.isArray(data.tests)) {
                testsArray = data.tests;
            } else if (Array.isArray(data)) {
                testsArray = data;
            }

            // Normalize test properties - backend uses 'test_name' but we need 'name' for display
            const normalizedTests = testsArray.map(test => ({
                ...test,
                name: test.name || test.test_name,  // Use 'name' if available, otherwise use 'test_name'
            }));

            setLabTests(normalizedTests);
        } catch (err) {
            console.error('Error fetching lab tests:', err);
            setError('Failed to load lab tests');
            setLabTests([]);
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories - safely handle undefined labTests
    const categories = ['all', ...new Set((labTests || []).map(t => t?.category).filter(Boolean))];

    // Filter lab tests - safely handle undefined properties
    const filteredTests = (labTests || []).filter(test => {
        if (!test || !test.name) return false;
        const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (test.code?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleToggleTest = (test) => {
        const isAdded = localTests.some(t => t.lab_test_id === test.id);
        if (isAdded) {
            setLocalTests(prev => prev.filter(t => t.lab_test_id !== test.id));
        } else {
            setLocalTests(prev => [...prev, {
                lab_test_id: test.id,
                test_name: test.name,
                price: test.price,
                category: test.category,
                notes: ''
            }]);
        }
    };

    const handleUpdateNotes = (testId, notes) => {
        setLocalTests(prev => prev.map(t =>
            t.lab_test_id === testId ? { ...t, notes } : t
        ));
    };

    const handleRemoveTest = (testId) => {
        setLocalTests(prev => prev.filter(t => t.lab_test_id !== testId));
    };

    const handleSave = () => {
        // Transform to the format backend expects
        // Backend typically expects: [{ test_id: number, notes: string }, ...]
        const formattedTests = localTests.map(test => ({
            test_id: test.lab_test_id,  // Use test_id to match backend expectation
            notes: test.notes || ''
        }));

        onSave(formattedTests);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-teal-500 p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FlaskConical size={24} />
                            Lab Tests
                        </h2>
                        <p className="text-teal-100 text-sm">Select laboratory tests to order</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <AlertCircle size={18} />
                            <p className="text-sm">{error}</p>
                            <button onClick={fetchLabTests} className="ml-auto text-sm underline">Retry</button>
                        </div>
                    )}

                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search lab tests..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-teal-600" size={32} />
                            <span className="ml-2 text-gray-600">Loading tests...</span>
                        </div>
                    )}

                    {/* Available Tests Grid */}
                    {!loading && (
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-2">
                                Available Tests ({filteredTests.length})
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {filteredTests.map(test => {
                                    const isSelected = localTests.some(t => t.lab_test_id === test.id);
                                    return (
                                        <button
                                            key={test.id}
                                            onClick={() => handleToggleTest(test)}
                                            className={`p-3 border rounded-lg text-left transition flex items-center gap-3 ${isSelected
                                                ? 'border-teal-400 bg-teal-50'
                                                : 'border-gray-200 hover:border-teal-300'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-teal-600 bg-teal-600' : 'border-gray-300'
                                                }`}>
                                                {isSelected && <CheckCircle size={12} className="text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 text-sm truncate">{test.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {test.category} • KES {test.price}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selected Tests */}
                    {localTests.length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-600 mb-2">
                                Selected Tests ({localTests.length})
                            </p>
                            <div className="space-y-2">
                                {localTests.map(test => (
                                    <div
                                        key={test.lab_test_id}
                                        className="p-3 rounded-lg border border-teal-200 bg-teal-50"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-medium text-gray-800">{test.test_name}</p>
                                                <p className="text-xs text-gray-500">KES {test.price}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveTest(test.lab_test_id)}
                                                className="p-1.5 hover:bg-red-100 rounded-lg transition text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={test.notes || ''}
                                            onChange={(e) => handleUpdateNotes(test.lab_test_id, e.target.value)}
                                            placeholder="Add notes for this test..."
                                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-teal-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && localTests.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                            <AlertCircle size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No tests selected yet</p>
                            <p className="text-xs">Click on tests to add them</p>
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
                        Save Lab Orders ({localTests.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LabOrderModal;
