import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_DOMAINS } from '../../config/appConfig';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { slugifyHospitalIdentifier } from '../../utils/tenantContext';
import {
    Building2, Upload, Save, ArrowLeft,
    MapPin, Phone, Mail, Globe, FileText, User, Lock, Eye, EyeOff
} from 'lucide-react';

const normalizeConsultationFeeValue = (value, fallback = '500.00') => {
    const parsedValue = Number.parseFloat(value);
    return Number.isFinite(parsedValue) ? parsedValue.toFixed(2) : fallback;
};

const HospitalForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authenticatedFetch, API_BASE_URL } = useAuth();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        city: '',
        county: '',
        country: 'Kenya',
        phone: '',
        alternative_phone: '',
        email: '',
        website: '',
        license_number: '',
        tax_pin: '',
        consultation_fee: 500,
        subscription_status: 'trial',
        subscription_expires_at: '',
        is_active: true,
        // Admin details (for new hospitals)
        admin_username: '',
        admin_password: '',
        admin_phone: '',
        admin_email: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (isEditing) {
            fetchHospital();
        }
    }, [id]);

    const fetchHospital = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/superadmin/hospitals/${id}`);
            const data = await res.json();
            if (data.success) {
                setFormData({
                    ...data.hospital,
                    consultation_fee: normalizeConsultationFeeValue(data.hospital.consultation_fee),
                    subscription_expires_at: data.hospital.subscription_expires_at?.split('T')[0] || ''
                });
                if (data.hospital.logo_path) {
                    setLogoPreview(resolveAssetUrl(data.hospital.logo_path));
                }
            }
        } catch (error) {
            console.error('Fetch hospital error:', error);
            setError('Failed to load hospital data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? checked
                : name === 'consultation_fee'
                    ? value
                    : value
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const formPayload = new FormData();
            Object.keys(formData).forEach(key => {
                const value =
                    key === 'consultation_fee'
                        ? normalizeConsultationFeeValue(formData[key])
                        : formData[key];

                if (value !== null && value !== '') {
                    formPayload.append(key, value);
                }
            });
            if (logoFile) {
                formPayload.append('logo', logoFile);
            }

            const url = isEditing
                ? `${API_BASE_URL}/superadmin/hospitals/${id}`
                : `${API_BASE_URL}/superadmin/hospitals`;

            const res = await authenticatedFetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: {}, // Let browser set content-type for FormData
                body: formPayload
            });

            const data = await res.json();
            if (res.ok && data.success) {
                navigate('/superadmin/hospitals');
            } else {
                setError(data.error || 'Failed to save hospital');
            }
        } catch (error) {
            console.error('Save hospital error:', error);
            setError('Failed to save hospital');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const hospitalTenantSlug = slugifyHospitalIdentifier(formData.name || formData.code || 'hospital');

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">
                        {isEditing ? 'Edit Hospital' : 'Add New Hospital'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isEditing ? 'Update hospital details' : 'Register a new hospital on the platform'}
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo Upload */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Hospital Logo</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    className="w-24 h-24 rounded-xl object-cover border border-gray-200"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
                                    <Building2 size={32} className="text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                                <Upload size={18} />
                                <span className="font-medium">Upload Logo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-gray-500 text-sm mt-2">PNG, JPG up to 5MB</p>
                        </div>
                    </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hospital Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="e.g. Central Medical Hospital"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hospital Code * <span className="text-gray-400">(for login URL)</span>
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                required
                                disabled={isEditing}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono uppercase disabled:bg-gray-50"
                                placeholder="e.g. CMH001"
                            />
                            {!isEditing && (
                                <p className="text-gray-500 text-xs mt-1">
                                    Login URL: {hospitalTenantSlug}.{APP_DOMAINS.hospitalRootDomain}:5173/login
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone size={14} className="inline mr-1" /> Phone
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="+254 7XX XXX XXX"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Alternative Phone
                            </label>
                            <input
                                type="tel"
                                name="alternative_phone"
                                value={formData.alternative_phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Mail size={14} className="inline mr-1" /> Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="info@hospital.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Globe size={14} className="inline mr-1" /> Website
                            </label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="https://hospital.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        <MapPin size={18} className="inline mr-1" /> Location
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="Street address"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                            <input
                                type="text"
                                name="county"
                                value={formData.county}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <input
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Legal & Subscription */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        <FileText size={18} className="inline mr-1" /> Legal & Subscription
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                            <input
                                type="text"
                                name="license_number"
                                value={formData.license_number}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax PIN</label>
                            <input
                                type="text"
                                name="tax_pin"
                                value={formData.tax_pin}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
                            <select
                                name="subscription_status"
                                value={formData.subscription_status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="trial">Trial</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="expired">Expired</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Expires</label>
                            <input
                                type="date"
                                name="subscription_expires_at"
                                value={formData.subscription_expires_at}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (KES)</label>
                            <input
                                type="number"
                                name="consultation_fee"
                                value={formData.consultation_fee}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <label className="text-sm font-medium text-gray-700">Hospital is Active</label>
                        </div>
                    </div>
                </div>

                {/* Admin Details - Only show for new hospitals */}
                {!isEditing && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            <User size={18} className="inline mr-1" /> Initial Admin Account
                        </h2>
                        <p className="text-gray-500 text-sm mb-4">
                            Create the first administrator account for this hospital. This user will be able to manage hospital settings, users, and data.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <User size={14} className="inline mr-1" /> Admin Username *
                                </label>
                                <input
                                    type="text"
                                    name="admin_username"
                                    value={formData.admin_username}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g. admin.hospital"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Lock size={14} className="inline mr-1" /> Admin Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="admin_password"
                                        value={formData.admin_password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Min 6 characters"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Phone size={14} className="inline mr-1" /> Admin Phone
                                </label>
                                <input
                                    type="tel"
                                    name="admin_phone"
                                    value={formData.admin_phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="+254 7XX XXX XXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail size={14} className="inline mr-1" /> Admin Email
                                </label>
                                <input
                                    type="email"
                                    name="admin_email"
                                    value={formData.admin_email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="admin@hospital.com"
                                />
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-700">
                                <strong>Note:</strong> The admin will use this username and password to log in.
                                Make sure to share the credentials securely.
                            </p>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                {isEditing ? 'Update Hospital' : 'Create Hospital'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HospitalForm;
