const NotesSection = ({ notes, onNotesChange, disabled = false }) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <label className="block text-gray-700 font-semibold mb-2">Clinical Notes</label>
            <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                className="w-full bg-white text-gray-800 border border-gray-300 rounded-lg p-3 h-40 text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Enter clinical observations, symptoms, examination findings..."
                disabled={disabled}
            />
        </div>
    );
};

export default NotesSection;
