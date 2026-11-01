import { Plus, Trash2, Search } from 'lucide-react';

const LabOrderSection = ({
    selectedTests,
    labTests,
    labTestSearch,
    setLabTestSearch,
    filteredLabTests,
    onAddTest,
    onRemoveTest,
    onTestChange,
    isReopened = false,
    disabled = false
}) => {

    const handleSelectTest = (test) => {
        onAddTest(String(test.id));
        setLabTestSearch('');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Lab Tests</h3>
                    <p className="text-xs text-gray-600 mt-1">
                        {isReopened && selectedTests.length > 0
                            ? `${selectedTests.length} test(s) ordered`
                            : 'Order laboratory tests for this patient'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => onAddTest('')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                    disabled={disabled}
                >
                    <Plus size={16} />
                    Add Lab Test
                </button>
            </div>

            {/* Lab Test Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={labTestSearch}
                        onChange={(e) => setLabTestSearch(e.target.value)}
                        placeholder="Search lab tests by name or code..."
                        className="w-full pl-10 pr-3 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={disabled}
                    />
                </div>

                {labTestSearch && (
                    <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredLabTests.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {filteredLabTests.map(test => (
                                    <button
                                        key={test.id}
                                        type="button"
                                        onClick={() => handleSelectTest(test)}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition"
                                        disabled={selectedTests.includes(String(test.id))}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-800">{test.test_name}</p>
                                                <p className="text-xs text-gray-600">
                                                    Code: {test.test_code} • Category: {test.category}
                                                </p>
                                            </div>
                                            <span className="text-blue-600 font-semibold">KES {test.price}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No lab tests found matching "{labTestSearch}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected Tests */}
            <div className="space-y-2">
                {selectedTests.map((testId, index) => {
                    const test = labTests.find(t => String(t.id) === testId);

                    return (
                        <div key={index} className="flex items-center gap-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex-1">
                                <select
                                    value={testId}
                                    onChange={(e) => onTestChange(index, e.target.value)}
                                    className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                    disabled={disabled}
                                >
                                    <option value="">-- Select Lab Test --</option>
                                    {labTests.map(t => (
                                        <option key={t.id} value={String(t.id)} disabled={selectedTests.includes(String(t.id)) && String(t.id) !== testId}>
                                            {t.test_name} ({t.test_code}) - KES {t.price}
                                        </option>
                                    ))}
                                </select>
                                {test && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        Category: {test.category}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemoveTest(index)}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                title="Remove test"
                                disabled={disabled}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    );
                })}

                {selectedTests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No lab tests ordered.</p>
                        <p className="text-xs mt-1">Use the search above or click "Add Lab Test" to order tests.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabOrderSection;
