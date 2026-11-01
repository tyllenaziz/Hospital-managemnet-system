import { ClipboardList, Pill, FlaskConical, ChevronRight, Scan } from 'lucide-react';

const ConsultationActionCard = ({ type, count, items, onClick, disabled }) => {
    const configs = {
        diagnosis: {
            icon: ClipboardList,
            title: 'Diagnosis',
            bgGradient: 'from-indigo-500 to-purple-600',
            bgLight: 'bg-indigo-50',
            borderColor: 'border-indigo-200',
            textColor: 'text-indigo-700',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600'
        },
        prescription: {
            icon: Pill,
            title: 'Prescription',
            bgGradient: 'from-green-500 to-emerald-600',
            bgLight: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-700',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        lab: {
            icon: FlaskConical,
            title: 'Lab Tests',
            bgGradient: 'from-purple-500 to-violet-600',
            bgLight: 'bg-purple-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-700',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
        imaging: {
            icon: Scan,
            title: 'Imaging',
            bgGradient: 'from-cyan-500 to-blue-600',
            bgLight: 'bg-cyan-50',
            borderColor: 'border-cyan-200',
            textColor: 'text-cyan-700',
            iconBg: 'bg-cyan-100',
            iconColor: 'text-cyan-600'
        }
    };

    const config = configs[type];
    if (!config) return null;
    const Icon = config.icon;

    // Get preview text
    const getPreview = () => {
        if (!items || items.length === 0) {
            return 'Click to add';
        }

        if (type === 'diagnosis') {
            const primary = items.find(i => i.is_primary);
            return primary ? `${primary.code}: ${primary.description}` : items[0]?.description;
        }

        if (type === 'prescription') {
            return items.slice(0, 2).map(i => i.medicine_name || i.custom_medicine_name).join(', ') +
                (items.length > 2 ? '...' : '');
        }

        if (type === 'lab') {
            return items.slice(0, 2).map(i => i.test_name).join(', ') +
                (items.length > 2 ? '...' : '');
        }

        if (type === 'imaging') {
            return items.slice(0, 2).map(i => i.imaging_name).join(', ') +
                (items.length > 2 ? '...' : '');
        }

        return '';
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full p-4 rounded-xl border-2 ${config.borderColor} ${config.bgLight} 
                  hover:shadow-md transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-lg ${config.iconBg}`}>
                        <Icon size={22} className={config.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${config.textColor}`}>{config.title}</h3>
                            {count > 0 && (
                                <span className={`px-2 py-0.5 bg-gradient-to-r ${config.bgGradient} text-white text-xs rounded-full font-medium`}>
                                    {count}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                            {getPreview()}
                        </p>
                    </div>
                </div>
                <ChevronRight
                    size={20}
                    className={`${config.textColor} opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0`}
                />
            </div>
        </button>
    );
};

export default ConsultationActionCard;
