import { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, CheckCircle, Pill, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

// Debounce hook for search
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const PrescriptionModal = ({ isOpen, onClose, prescriptionItems, onSave }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [localItems, setLocalItems] = useState(prescriptionItems || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        medicine_id: '',
        medicine_name: '',
        custom_medicine_name: '',
        quantity: 1,
        quantity_mg: '', // NEW: quantity in mg
        dosage: '',
        duration: '',
        instructions: ''
    });

    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        setLocalItems(prescriptionItems || []);
    }, [prescriptionItems, isOpen]);

    // Search medicines from API
    useEffect(() => {
        if (debouncedSearch.length >= 2 && !showAddForm) {
            searchMedicines(debouncedSearch);
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearch, showAddForm]);

    const searchMedicines = async (query) => {
        setLoading(true);
        try {
            const response = await authenticatedFetch(`${API_BASE_URL}/medicines?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            // Handle the backend response format
            if (data.success && Array.isArray(data.medicines)) {
                setSearchResults(data.medicines.slice(0, 10));
            } else if (Array.isArray(data)) {
                setSearchResults(data.slice(0, 10));
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            console.error('Error searching medicines:', err);
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMedicine = (medicine) => {
        setNewItem({
            medicine_id: medicine.id,
            medicine_name: medicine.name,
            custom_medicine_name: '',
            quantity: 1,
            quantity_mg: '',
            dosage: '',
            duration: '',
            instructions: ''
        });
        setSearchQuery('');
        setSearchResults([]);
        setShowAddForm(true);
    };

    const handleAddCustomMedicine = () => {
        if (!searchQuery.trim()) return;
        setNewItem({
            medicine_id: '',
            medicine_name: '',
            custom_medicine_name: searchQuery.trim(),
            quantity: 1,
            quantity_mg: '',
            dosage: '',
            duration: '',
            instructions: ''
        });
        setShowAddForm(true);
    };

    const handleAddToList = () => {
        if (!newItem.medicine_id && !newItem.custom_medicine_name) return;
        if (!newItem.dosage || !newItem.quantity) {
            toast.error('Please fill in dosage and quantity');
            return;
        }

        const updatedItems = [...localItems, { ...newItem }];
        setLocalItems(updatedItems);
        onSave(updatedItems);
        setNewItem({
            medicine_id: '',
            medicine_name: '',
            custom_medicine_name: '',
            quantity: 1,
            quantity_mg: '',
            dosage: '',
            duration: '',
            instructions: ''
        });
        setShowAddForm(false);
        setSearchQuery('');
    };

    const handleRemoveItem = (index) => {
        const updatedItems = localItems.filter((_, i) => i !== index);
        setLocalItems(updatedItems);
        onSave(updatedItems);
    };

    const handleSave = () => {
        onSave(localItems);
        onClose();
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setNewItem({
            medicine_id: '',
            medicine_name: '',
            custom_medicine_name: '',
            quantity: 1,
            quantity_mg: '',
            dosage: '',
            duration: '',
            instructions: ''
        });
    };

    // Common dosages for quick selection
    const commonDosages = ['1x1', '1x2', '1x3', '2x2', '2x3', '1 stat'];
    const commonDurations = ['3 days', '5 days', '7 days', '14 days', '1 month'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-teal-700 p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Pill size={24} />
                            Prescription
                        </h2>
                        <p className="text-teal-100 text-sm">Search and add medicines</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Add Medicine Form or Search */}
                    {!showAddForm ? (
                        <>
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search medicine by name..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    autoFocus
                                />
                                {loading && (
                                    <Loader2 className="absolute right-3 top-3 animate-spin text-teal-600" size={18} />
                                )}
                            </div>

                            {/* Search Results */}
                            {searchQuery.length >= 2 && (
                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                                    {searchResults.map(med => (
                                        <button
                                            key={med.id}
                                            onClick={() => handleSelectMedicine(med)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-800">{med.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Stock: {med.stock || med.stock_quantity || 0} • KES {med.price || med.selling_price || 0}
                                                </p>
                                            </div>
                                            <Plus size={16} className="text-gray-400" />
                                        </button>
                                    ))}
                                    {searchResults.length === 0 && !loading && (
                                        <button
                                            onClick={handleAddCustomMedicine}
                                            className="w-full px-4 py-3 text-left hover:bg-teal-50 transition flex justify-between items-center text-teal-700"
                                        >
                                            <div>
                                                <p className="font-medium">Add "{searchQuery}" as custom medicine</p>
                                                <p className="text-xs">Not found in inventory</p>
                                            </div>
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Add Medicine Form */
                        <div className="bg-teal-50 rounded-lg border border-teal-200 p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        {newItem.medicine_name || newItem.custom_medicine_name}
                                    </h3>
                                    {newItem.custom_medicine_name && (
                                        <span className="text-xs text-orange-600">Custom medicine</span>
                                    )}
                                </div>
                                <button
                                    onClick={handleCancel}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newItem.quantity}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (mg)</label>
                                    <input
                                        type="text"
                                        value={newItem.quantity_mg}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity_mg: e.target.value }))}
                                        placeholder="e.g., 500mg"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
                                    <input
                                        type="text"
                                        value={newItem.dosage}
                                        onChange={(e) => setNewItem(prev => ({ ...prev, dosage: e.target.value }))}
                                        placeholder="e.g., 1x3"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>

                            {/* Quick dosage selection */}
                            <div className="flex flex-wrap gap-1">
                                {commonDosages.map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setNewItem(prev => ({ ...prev, dosage: d }))}
                                        className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-teal-100 rounded transition"
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                <input
                                    type="text"
                                    value={newItem.duration}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, duration: e.target.value }))}
                                    placeholder="e.g., 5 days"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {commonDurations.map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setNewItem(prev => ({ ...prev, duration: d }))}
                                            className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-teal-100 rounded transition"
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                                <input
                                    type="text"
                                    value={newItem.instructions}
                                    onChange={(e) => setNewItem(prev => ({ ...prev, instructions: e.target.value }))}
                                    placeholder="e.g., Take after meals"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            <button
                                onClick={handleAddToList}
                                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Add to Prescription
                            </button>
                        </div>
                    )}

                    {/* Prescription List */}
                    {localItems.length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-600 mb-2">
                                Prescription Items ({localItems.length})
                            </p>
                            <div className="space-y-2">
                                {localItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">
                                                {item.medicine_name || item.custom_medicine_name}
                                                {item.custom_medicine_name && (
                                                    <span className="ml-2 text-xs text-orange-500">(Custom)</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Qty: {item.quantity}
                                                {item.quantity_mg && ` (${item.quantity_mg})`}
                                                {' • '}{item.dosage}
                                                {item.duration && ` • ${item.duration}`}
                                            </p>
                                            {item.instructions && (
                                                <p className="text-xs text-gray-500 italic">{item.instructions}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-2 hover:bg-red-100 rounded-lg transition text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {localItems.length === 0 && !showAddForm && (
                        <div className="text-center py-6 text-gray-500">
                            <AlertCircle size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No medicines added yet</p>
                            <p className="text-xs">Search for a medicine to add</p>
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
                        Done ({localItems.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionModal;
