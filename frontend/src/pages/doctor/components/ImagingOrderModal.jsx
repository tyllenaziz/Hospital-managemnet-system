import { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, CheckCircle, Scan, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const ImagingOrderModal = ({ isOpen, onClose, selectedImaging = [], onSave }) => {
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const [localItems, setLocalItems] = useState(selectedImaging || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(false);

    // Common imaging services (these can be fetched from API later)
    const imagingServices = [
        // X-Ray
        { id: 1, name: 'Chest X-Ray (PA View)', category: 'X-Ray', price: 1500 },
        { id: 2, name: 'Chest X-Ray (Lateral)', category: 'X-Ray', price: 1500 },
        { id: 3, name: 'Abdominal X-Ray', category: 'X-Ray', price: 1500 },
        { id: 4, name: 'Skull X-Ray', category: 'X-Ray', price: 1800 },
        { id: 5, name: 'Spine X-Ray (Cervical)', category: 'X-Ray', price: 2000 },
        { id: 6, name: 'Spine X-Ray (Lumbar)', category: 'X-Ray', price: 2000 },
        { id: 7, name: 'Pelvis X-Ray', category: 'X-Ray', price: 1800 },
        { id: 8, name: 'Knee X-Ray', category: 'X-Ray', price: 1500 },
        { id: 9, name: 'Hand/Wrist X-Ray', category: 'X-Ray', price: 1200 },
        { id: 10, name: 'Foot/Ankle X-Ray', category: 'X-Ray', price: 1200 },

        // Ultrasound
        { id: 20, name: 'Abdominal Ultrasound', category: 'Ultrasound', price: 2500 },
        { id: 21, name: 'Pelvic Ultrasound', category: 'Ultrasound', price: 2500 },
        { id: 22, name: 'Obstetric Ultrasound', category: 'Ultrasound', price: 3000 },
        { id: 23, name: 'Thyroid Ultrasound', category: 'Ultrasound', price: 2500 },
        { id: 24, name: 'Breast Ultrasound', category: 'Ultrasound', price: 3000 },
        { id: 25, name: 'Doppler Ultrasound (Vascular)', category: 'Ultrasound', price: 4000 },
        { id: 26, name: 'Echocardiogram', category: 'Ultrasound', price: 5000 },

        // CT Scan
        { id: 40, name: 'CT Brain (Plain)', category: 'CT Scan', price: 8000 },
        { id: 41, name: 'CT Brain (Contrast)', category: 'CT Scan', price: 12000 },
        { id: 42, name: 'CT Chest', category: 'CT Scan', price: 10000 },
        { id: 43, name: 'CT Abdomen', category: 'CT Scan', price: 12000 },
        { id: 44, name: 'CT Abdomen & Pelvis', category: 'CT Scan', price: 15000 },
        { id: 45, name: 'CT Spine', category: 'CT Scan', price: 10000 },
        { id: 46, name: 'CT Angiography', category: 'CT Scan', price: 18000 },

        // MRI
        { id: 60, name: 'MRI Brain', category: 'MRI', price: 15000 },
        { id: 61, name: 'MRI Spine (Cervical)', category: 'MRI', price: 15000 },
        { id: 62, name: 'MRI Spine (Lumbar)', category: 'MRI', price: 15000 },
        { id: 63, name: 'MRI Knee', category: 'MRI', price: 12000 },
        { id: 64, name: 'MRI Shoulder', category: 'MRI', price: 12000 },
        { id: 65, name: 'MRI Abdomen', category: 'MRI', price: 18000 },

        // Other
        { id: 80, name: 'Mammography', category: 'Other', price: 4000 },
        { id: 81, name: 'Fluoroscopy', category: 'Other', price: 5000 },
        { id: 82, name: 'Bone Densitometry (DEXA)', category: 'Other', price: 6000 }
    ];

    useEffect(() => {
        if (isOpen) {
            setLocalItems(selectedImaging || []);
        }
    }, [isOpen]); // Only sync when modal opens to avoid loops

    // Get unique categories
    const categories = ['all', ...new Set(imagingServices.map(t => t.category))];

    // Filter imaging services
    const filteredServices = imagingServices.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleToggleService = (service) => {
        const isAdded = localItems.some(t => t.imaging_id === service.id);
        if (isAdded) {
            setLocalItems(prev => prev.filter(t => t.imaging_id !== service.id));
        } else {
            setLocalItems(prev => [...prev, {
                imaging_id: service.id,
                imaging_name: service.name,
                price: service.price,
                category: service.category,
                notes: '',
                urgency: 'routine'
            }]);
        }
    };

    const handleUpdateNotes = (serviceId, notes) => {
        setLocalItems(prev => prev.map(t =>
            t.imaging_id === serviceId ? { ...t, notes } : t
        ));
    };

    const handleUpdateUrgency = (serviceId, urgency) => {
        setLocalItems(prev => prev.map(t =>
            t.imaging_id === serviceId ? { ...t, urgency } : t
        ));
    };

    const handleRemoveService = (serviceId) => {
        setLocalItems(prev => prev.filter(t => t.imaging_id !== serviceId));
    };

    const handleSave = () => {
        onSave(localItems);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-cyan-600 p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Scan size={24} />
                            Imaging / Radiology
                        </h2>
                        <p className="text-cyan-100 text-sm">Order X-Ray, Ultrasound, CT, MRI</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Search & Filter */}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search imaging services..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Types' : cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Available Services Grid */}
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">
                            Available Services ({filteredServices.length})
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {filteredServices.map(service => {
                                const isSelected = localItems.some(t => t.imaging_id === service.id);
                                return (
                                    <button
                                        key={service.id}
                                        onClick={() => handleToggleService(service)}
                                        className={`p-3 border rounded-lg text-left transition flex items-center gap-3 ${isSelected
                                            ? 'border-cyan-400 bg-cyan-50'
                                            : 'border-gray-200 hover:border-cyan-300'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-cyan-600 bg-cyan-600' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <CheckCircle size={12} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 text-sm truncate">{service.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {service.category} • KES {service.price.toLocaleString()}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Services */}
                    {localItems.length > 0 && (
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-600 mb-2">
                                Selected Services ({localItems.length})
                            </p>
                            <div className="space-y-2">
                                {localItems.map(item => (
                                    <div
                                        key={item.imaging_id}
                                        className="p-3 rounded-lg border border-cyan-200 bg-cyan-50"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-medium text-gray-800">{item.imaging_name}</p>
                                                <p className="text-xs text-gray-500">{item.category} • KES {item.price?.toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveService(item.imaging_id)}
                                                className="p-1.5 hover:bg-red-100 rounded-lg transition text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Urgency</label>
                                                <select
                                                    value={item.urgency || 'routine'}
                                                    onChange={(e) => handleUpdateUrgency(item.imaging_id, e.target.value)}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500"
                                                >
                                                    <option value="routine">Routine</option>
                                                    <option value="urgent">Urgent</option>
                                                    <option value="stat">STAT</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Clinical Notes</label>
                                                <input
                                                    type="text"
                                                    value={item.notes || ''}
                                                    onChange={(e) => handleUpdateNotes(item.imaging_id, e.target.value)}
                                                    placeholder="e.g., R/O fracture"
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-cyan-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {localItems.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                            <AlertCircle size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No imaging services selected</p>
                            <p className="text-xs">Click on services to add them</p>
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
                        className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} />
                        Save Imaging Orders ({localItems.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImagingOrderModal;
