import { Plus, Trash2, Search } from 'lucide-react';

const PrescriptionSection = ({
    prescriptionItems,
    medicines,
    medicineSearch,
    setMedicineSearch,
    filteredMedicines,
    onAddItem,
    onRemoveItem,
    onItemChange,
    isReopened = false,
    disabled = false
}) => {

    const handleSelectMedicine = (med) => {
        const newItem = {
            medicine_id: med.id,
            custom_medicine_name: '',
            quantity: 1,
            dosage: '',
            duration: '',
            instructions: ''
        };
        onAddItem(newItem);
        setMedicineSearch('');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Prescription</h3>
                    <p className="text-xs text-gray-600 mt-1">
                        {isReopened && prescriptionItems.length > 0
                            ? `${prescriptionItems.length} medicine(s) loaded from previous prescription`
                            : 'Select medicines from inventory or enter custom medicine names'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onAddItem()}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                    disabled={disabled}
                >
                    <Plus size={16} />
                    Add Medicine
                </button>
            </div>

            {/* Medicine Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={medicineSearch}
                        onChange={(e) => setMedicineSearch(e.target.value)}
                        placeholder="Search medicines by name or barcode..."
                        className="w-full pl-10 pr-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        disabled={disabled}
                    />
                </div>

                {medicineSearch && (
                    <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredMedicines.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {filteredMedicines.map(med => (
                                    <button
                                        key={med.id}
                                        type="button"
                                        onClick={() => handleSelectMedicine(med)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-800">{med.name}</p>
                                            <p className="text-xs text-gray-600">
                                                {med.barcode && `Barcode: ${med.barcode} • `}
                                                Stock: {med.stock} units
                                            </p>
                                        </div>
                                        <span className="text-teal-600 font-semibold">KES {med.price}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No medicines found matching "{medicineSearch}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Prescription Items */}
            <div className="space-y-3">
                {prescriptionItems.map((item, index) => {
                    const medicineName = item.medicine_id
                        ? medicines.find(m => m.id === parseInt(item.medicine_id))?.name
                        : item.custom_medicine_name || item.medicine_name;

                    return (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="space-y-3">
                                {isReopened && medicineName && (
                                    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                                        <p className="text-xs text-blue-700">
                                            <strong>Previously prescribed:</strong> {medicineName}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Select from Inventory
                                        </label>
                                        <select
                                            value={item.medicine_id || ''}
                                            onChange={(e) => {
                                                onItemChange(index, 'medicine_id', e.target.value);
                                                if (e.target.value) {
                                                    onItemChange(index, 'custom_medicine_name', '');
                                                }
                                            }}
                                            className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                                            disabled={item.custom_medicine_name !== '' || disabled}
                                        >
                                            <option value="">-- Select Medicine --</option>
                                            {medicines.map(med => (
                                                <option key={med.id} value={med.id}>
                                                    {med.name} - KES {med.price} (Stock: {med.stock})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Or Enter Custom Medicine Name
                                        </label>
                                        <input
                                            type="text"
                                            value={item.custom_medicine_name || ''}
                                            onChange={(e) => {
                                                onItemChange(index, 'custom_medicine_name', e.target.value);
                                                if (e.target.value) {
                                                    onItemChange(index, 'medicine_id', '');
                                                }
                                            }}
                                            className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                                            placeholder="e.g., Amoxicillin 250mg"
                                            disabled={item.medicine_id !== '' || disabled}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => onItemChange(index, 'quantity', e.target.value)}
                                        className="bg-white text-gray-800 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                                        placeholder="Quantity"
                                        min="1"
                                        disabled={disabled}
                                    />
                                    <input
                                        type="text"
                                        value={item.dosage || ''}
                                        onChange={(e) => onItemChange(index, 'dosage', e.target.value)}
                                        className="bg-white text-gray-800 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                                        placeholder="e.g., 500mg"
                                        disabled={disabled}
                                    />
                                    <input
                                        type="text"
                                        value={item.duration || ''}
                                        onChange={(e) => onItemChange(index, 'duration', e.target.value)}
                                        className="bg-white text-gray-800 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                                        placeholder="e.g., 7 days"
                                        disabled={disabled}
                                    />
                                    <input
                                        type="text"
                                        value={item.instructions || ''}
                                        onChange={(e) => onItemChange(index, 'instructions', e.target.value)}
                                        className="col-span-2 md:col-span-1 bg-white text-gray-800 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                                        placeholder="e.g., After meals"
                                        disabled={disabled}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onRemoveItem(index)}
                                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center"
                                        title="Remove medicine"
                                        disabled={disabled}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {prescriptionItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No medicines added yet.</p>
                        <p className="text-xs mt-1">Use the search above or click "Add Medicine" to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrescriptionSection;
